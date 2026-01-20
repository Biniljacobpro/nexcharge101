import { predictEnergyConsumption } from './energyClient.js';

/**
 * Calculate Haversine distance between two points
 * @param {Object} point1 - First point {lat, lng}
 * @param {Object} point2 - Second point {lat, lng}
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate estimated travel time between two points
 * @param {number} distance - Distance in kilometers
 * @param {number} avgSpeed - Average speed in km/h (default 60 km/h)
 * @returns {number} Time in minutes
 */
const calculateTravelTime = (distance, avgSpeed = 60) => {
  return (distance / avgSpeed) * 60; // Convert to minutes
};

/**
 * Modified Dijkstra's algorithm for EV route optimization
 * 
 * This algorithm finds the optimal route considering:
 * - Driving time between nodes
 * - Charging time at charging stops
 * - Detour penalties for charging stops
 * - SOC constraints (never below 10%)
 * 
 * Graph representation:
 * - Nodes: start, charging stations, destination
 * - Edges: reachable segments based on vehicle's SOC
 * - Edge weights: driving_time + charging_time + detour_penalty
 * 
 * @param {Object} graph - Graph representation of route network
 * @param {string} startNodeId - ID of start node
 * @param {string} endNodeId - ID of end node
 * @param {Object} vehicle - Vehicle specifications
 * @param {number} initialSOC - Initial state of charge (0-100)
 * @returns {Object} Optimal path with charging stops
 */
const dijkstraOptimization = async (graph, startNodeId, endNodeId, vehicle, initialSOC) => {
  // Initialize distances and visited nodes
  const distances = {};
  const previous = {};
  const visited = {};
  const chargingStops = {}; // Track charging information for each node
  
  // Initialize all distances to infinity except start node
  for (const nodeId in graph) {
    distances[nodeId] = nodeId === startNodeId ? 0 : Infinity;
    previous[nodeId] = null;
    chargingStops[nodeId] = {
      arrivalSOC: nodeId === startNodeId ? initialSOC : 0,
      chargeToSOC: 0,
      chargingTime: 0
    };
  }
  
  // Priority queue implementation (simplified)
  const unvisited = Object.keys(graph);
  
  while (unvisited.length > 0) {
    // Find node with minimum distance
    let current = null;
    let minDistance = Infinity;
    
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }
    
    // If we reached the destination or no reachable nodes left
    if (current === endNodeId || current === null) {
      break;
    }
    
    // Mark current node as visited
    const currentIndex = unvisited.indexOf(current);
    unvisited.splice(currentIndex, 1);
    visited[current] = true;
    
    // Check all neighbors
    for (const neighborId in graph[current].edges) {
      if (visited[neighborId]) continue;
      
      const edge = graph[current].edges[neighborId];
      
      // Calculate energy needed for this segment
      const energyPrediction = await predictEnergyConsumption({
        distance: edge.distance,
        elevation_gain: edge.elevationGain || 0,
        vehicle_efficiency: vehicle.batteryCapacity || 60, // kWh
        battery_capacity: vehicle.batteryCapacity || 60
      });
      
      const energyNeeded = energyPrediction.predicted_energy_kwh;
      
      // Calculate SOC after traveling to this node
      const arrivalSOC = chargingStops[current].chargeToSOC || chargingStops[current].arrivalSOC;
      const socAfterTravel = arrivalSOC - (energyNeeded / vehicle.batteryCapacity) * 100;
      
      // Skip if we wouldn't have enough charge
      if (socAfterTravel < 10) {
        continue;
      }
      
      // Calculate charging time if needed (to reach 80% SOC)
      let chargingTime = 0;
      let chargeToSOC = socAfterTravel;
      
      // If this is a charging station and we need to charge
      if (graph[neighborId].isChargingStation && socAfterTravel < 40) {
        // Charge to 80% SOC
        const socToCharge = 80 - socAfterTravel;
        const energyToCharge = (socToCharge / 100) * vehicle.batteryCapacity;
        
        // Simplified charging time calculation
        // In reality, this would depend on the station's charging capabilities
        // and the vehicle's charging curve
        const maxChargingPower = Math.min(
          vehicle.chargingDC?.maxPower || 50,
          50 // Assuming 50kW charger as max
        );
        
        chargingTime = (energyToCharge / maxChargingPower) * 60; // Convert to minutes
        chargeToSOC = 80;
      }
      
      // Calculate edge weight (cost)
      // Cost = driving time + charging time + detour penalty
      const edgeWeight = edge.travelTime + chargingTime + edge.detourPenalty;
      const newDistance = distances[current] + edgeWeight;
      
      // If we found a shorter path
      if (newDistance < distances[neighborId]) {
        distances[neighborId] = newDistance;
        previous[neighborId] = current;
        chargingStops[neighborId] = {
          arrivalSOC: socAfterTravel,
          chargeToSOC: chargeToSOC,
          chargingTime: chargingTime
        };
      }
    }
  }
  
  // Reconstruct path
  const path = [];
  let currentNode = endNodeId;
  
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = previous[currentNode];
  }
  
  // Extract charging stops (excluding start and end)
  const stops = [];
  for (let i = 1; i < path.length - 1; i++) {
    const nodeId = path[i];
    if (graph[nodeId].isChargingStation) {
      stops.push({
        stationId: graph[nodeId].id,
        stationName: graph[nodeId].name,
        arrivalSOC: chargingStops[nodeId].arrivalSOC,
        chargeToSOC: chargingStops[nodeId].chargeToSOC,
        chargingTime: chargingStops[nodeId].chargingTime
      });
    }
  }
  
  return {
    path,
    totalDistance: distances[endNodeId],
    totalTime: distances[endNodeId], // In a real implementation, this would be more detailed
    chargingStops: stops,
    finalArrivalSOC: chargingStops[endNodeId]?.arrivalSOC || 0,
    noStationsAvailable: stops.length === 0 && chargingStops[endNodeId]?.arrivalSOC < 20
  };
};

/**
 * Build graph representation for route optimization
 * 
 * The graph model is used because:
 * 1. It naturally represents the route network with multiple possible paths
 * 2. It allows us to assign costs to edges (driving time + charging time + detour penalty)
 * 3. It enables the use of well-established algorithms like Dijkstra/A* for finding optimal paths
 * 4. It makes it easy to incorporate constraints (SOC never below 10%)
 * 5. It allows for extensibility (adding new nodes, changing edge weights, etc.)
 * 
 * @param {Object} start - Start coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @param {Array} stations - Array of charging stations
 * @returns {Object} Graph representation
 */
const buildGraph = async (start, destination, stations) => {
  const graph = {};
  
  // Add start node
  const startNodeId = 'start';
  graph[startNodeId] = {
    id: startNodeId,
    coordinates: start,
    isChargingStation: false,
    edges: {}
  };
  
  // Add destination node
  const destNodeId = 'destination';
  graph[destNodeId] = {
    id: destNodeId,
    coordinates: destination,
    isChargingStation: false,
    edges: {}
  };
  
  // Add charging stations as nodes
  const stationNodes = [];
  for (const station of stations) {
    const nodeId = `station_${station._id}`;
    graph[nodeId] = {
      id: station._id,
      coordinates: {
        lat: station.location.coordinates.latitude,
        lng: station.location.coordinates.longitude
      },
      isChargingStation: true,
      name: station.name,
      edges: {}
    };
    stationNodes.push(nodeId);
  }
  
  // Build edges between all nodes
  const allNodes = [startNodeId, ...stationNodes, destNodeId];
  
  for (const sourceNodeId of allNodes) {
    for (const targetNodeId of allNodes) {
      if (sourceNodeId === targetNodeId) continue;
      
      const sourceNode = graph[sourceNodeId];
      const targetNode = graph[targetNodeId];
      
      // Calculate distance between nodes
      const distance = calculateDistance(sourceNode.coordinates, targetNode.coordinates);
      
      // Estimate travel time
      const travelTime = calculateTravelTime(distance);
      
      // Calculate detour penalty (extra time compared to direct route)
      const directDistance = calculateDistance(start, destination);
      const detourPenalty = Math.max(0, (distance + calculateDistance(targetNode.coordinates, destination)) - directDistance);
      
      // In a real implementation, we would also fetch elevation data here
      // For now, we'll set it to 0
      const elevationGain = 0;
      
      // Add edge
      graph[sourceNodeId].edges[targetNodeId] = {
        distance,
        travelTime,
        detourPenalty,
        elevationGain
      };
    }
  }
  
  return graph;
};

/**
 * Optimize EV route using modified Dijkstra algorithm
 * 
 * Dijkstra's algorithm is chosen because:
 * 1. It guarantees finding the optimal path in a weighted graph
 * 2. It works well with our cost model (driving time + charging time + detour penalty)
 * 3. It can handle the constraints (SOC never below 10%) by pruning unreachable edges
 * 4. It's well-understood and has predictable performance characteristics
 * 5. It can be easily extended or modified for future enhancements
 * 
 * A* could also be used with a good heuristic function, but for this implementation
 * we're using Dijkstra for simplicity and guaranteed optimality.
 * 
 * @param {Object} params - Optimization parameters
 * @param {Object} params.start - Start coordinates {lat, lng}
 * @param {Object} params.destination - Destination coordinates {lat, lng}
 * @param {Object} params.vehicle - Vehicle specifications
 * @param {Array} params.stations - Array of charging stations
 * @param {number} params.currentSOC - Current state of charge (0-100)
 * @param {string} params.departureTime - Departure date and time (ISO string)
 * @returns {Object} Optimized route
 */
export const optimizeRoute = async ({ start, destination, vehicle, stations, currentSOC, departureTime }) => {
  try {
    // Build graph representation
    const graph = await buildGraph(start, destination, stations);
    
    // Run optimization algorithm
    const result = await dijkstraOptimization(
      graph,
      'start',
      'destination',
      vehicle,
      currentSOC
    );
    
    // Calculate total distance, time, and arrival times for each segment
    let totalDistance = 0;
    let totalTime = 0;
    let currentTime = new Date(departureTime || new Date()).getTime();
    
    // Calculate arrival times for each stop
    const stopsWithTimes = [];
    let pathIndex = 0;
    
    for (let i = 0; i < result.path.length - 1; i++) {
      const sourceNodeId = result.path[i];
      const targetNodeId = result.path[i + 1];
      
      if (graph[sourceNodeId] && graph[sourceNodeId].edges[targetNodeId]) {
        const edge = graph[sourceNodeId].edges[targetNodeId];
        totalDistance += edge.distance;
        totalTime += edge.travelTime;
        
        // Add travel time to current time
        currentTime += edge.travelTime * 60 * 1000; // Convert minutes to milliseconds
        
        // If target is a charging station, add it to stops with arrival time
        if (graph[targetNodeId].isChargingStation) {
          const stopData = result.chargingStops[pathIndex];
          if (stopData) {
            stopsWithTimes.push({
              ...stopData,
              arrivalTime: new Date(currentTime).toISOString()
            });
            // Add charging time to current time
            currentTime += stopData.chargingTime * 60 * 1000; // Convert minutes to milliseconds
            totalTime += stopData.chargingTime;
            pathIndex++;
          }
        }
      }
    }
    
    // Calculate estimated arrival time at destination
    const estimatedArrival = new Date(currentTime).toISOString();
    
    return {
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalTime: parseFloat(totalTime.toFixed(2)),
      chargingStops: stopsWithTimes,
      finalArrivalSOC: parseFloat(result.finalArrivalSOC.toFixed(2)),
      noStationsAvailable: result.noStationsAvailable || false,
      departureTime: departureTime || new Date().toISOString(),
      estimatedArrival: estimatedArrival
    };
  } catch (error) {
    console.error('Error optimizing route:', error);
    throw error;
  }
};

export default {
  optimizeRoute
};
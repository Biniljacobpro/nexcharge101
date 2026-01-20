import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Enhanced and more diverse training dataset
const trainingData = [
  // Positive examples - more diverse phrases
  ["Excellent charging experience, very fast!", "Positive"],
  ["Great service and clean station", "Positive"],
  ["The station was great!", "Positive"],
  ["Charger worked perfectly", "Positive"],
  ["Very convenient location", "Positive"],
  ["Smooth payment process", "Positive"],
  ["Highly recommended for EV owners", "Positive"],
  ["Reliable and efficient charging", "Positive"],
  ["Good ambience and quick service", "Positive"],
  ["Helpful staff and easy to use", "Positive"],
  ["Outstanding customer service", "Positive"],
  ["Impressive charging speed", "Positive"],
  ["Clean and well maintained", "Positive"],
  ["Convenient parking", "Positive"],
  ["Affordable pricing", "Positive"],
  ["User friendly app", "Positive"],
  ["good", "Positive"],
  ["nice", "Positive"],
  ["great", "Positive"],
  ["excellent", "Positive"],
  ["perfect", "Positive"],
  ["amazing", "Positive"],
  ["wonderful", "Positive"],
  ["fantastic", "Positive"],
  ["brilliant", "Positive"],
  ["awesome", "Positive"],
  ["superb", "Positive"],
  ["outstanding", "Positive"],
  ["exceptional", "Positive"],

  // Neutral examples - more context-specific
  ["It charged fine.", "Neutral"],
  ["The station was okay", "Neutral"],
  ["Charging took the expected time", "Neutral"],
  ["Standard charging experience", "Neutral"],
  ["No issues encountered", "Neutral"],
  ["Average service quality", "Neutral"],
  ["Met basic expectations", "Neutral"],
  ["Just another charging stop", "Neutral"],
  ["Normal operation", "Neutral"],
  ["As expected", "Neutral"],
  ["Nothing special", "Neutral"],
  ["Regular service", "Neutral"],
  ["Usual experience", "Neutral"],
  ["Business as usual", "Neutral"],
  ["Status quo", "Neutral"],
  ["okay", "Neutral"],
  ["fine", "Neutral"],
  ["average", "Neutral"],
  ["normal", "Neutral"],
  ["standard", "Neutral"],
  ["typical", "Neutral"],
  ["ordinary", "Neutral"],
  ["common", "Neutral"],

  // Negative examples - more specific EV charging issues
  ["Charger was broken.", "Negative"],
  ["Very slow charging speed", "Negative"],
  ["Poor maintenance of the station", "Negative"],
  ["Rude staff and dirty facilities", "Negative"],
  ["Payment system was down", "Negative"],
  ["Overpriced for the service", "Negative"],
  ["Had to wait 30 minutes for a charger", "Negative"],
  ["Station was out of order", "Negative"],
  ["App crashed during payment", "Negative"],
  ["Unreliable charging experience", "Negative"],
  ["Faulty equipment", "Negative"],
  ["No parking available", "Negative"],
  ["Cable was damaged", "Negative"],
  ["Connector didn't fit", "Negative"],
  ["Screen was broken", "Negative"],
  ["No shelter from weather", "Negative"],
  ["Toilet was dirty", "Negative"],
  ["No customer service", "Negative"],
  ["Wrong billing", "Negative"],
  ["Bad", "Negative"],
  ["bad", "Negative"],
  ["terrible", "Negative"],
  ["awful", "Negative"],
  ["horrible", "Negative"],
  ["broken", "Negative"],
  ["slow", "Negative"],
  ["expensive", "Negative"],
  ["dirty", "Negative"],
  ["rude", "Negative"],
  ["faulty", "Negative"],
  ["damaged", "Negative"],
  ["useless", "Negative"],
  ["frustrating", "Negative"],
  ["disappointing", "Negative"],
  ["annoying", "Negative"],
  ["inconvenient", "Negative"]
];

// Initialize the Naive Bayes classifier
const classifier = new natural.BayesClassifier();

/**
 * Preprocess text for better classification accuracy
 * - Lowercasing
 * - Removing punctuation & numbers
 * - Tokenizing
 * - Stemming (reduces words to root form)
 * - Adding bigrams for context
 */
function preprocessText(text) {
  if (!text) return '';
  let cleaned = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\d+/g, '');
  const tokens = tokenizer.tokenize(cleaned);
  const stemmedTokens = tokens.map(token => stemmer.stem(token));
  
  // Add bigrams (word pairs) for better context
  const bigrams = [];
  for (let i = 0; i < stemmedTokens.length - 1; i++) {
    bigrams.push(stemmedTokens[i] + ' ' + stemmedTokens[i + 1]);
  }
  
  // Combine unigrams and bigrams
  return [...stemmedTokens, ...bigrams].join(' ');
}

// Train the classifier with enhanced preprocessing
trainingData.forEach(([text, label]) => {
  // Add both original and enhanced versions for better training
  classifier.addDocument(preprocessText(text), label);
  
  // Also add the original text without bigrams for single word training
  const simpleTokens = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\d+/g, '');
  if (simpleTokens.trim() !== '') {
    classifier.addDocument(simpleTokens, label);
  }
});

classifier.train();

/**
 * Initialize and train the sentiment classifier
 * @returns {Object} - The trained classifier instance
 */
export function initClassifier() {
  return classifier;
}

/**
 * Classify the sentiment of a review text with confidence score
 * @param {string} reviewText - The raw review text to classify
 * @returns {Object} - Object with sentiment classification and confidence score
 */
export function classifySentimentWithConfidence(reviewText) {
  try {
    // Handle edge cases
    if (!reviewText || reviewText.trim() === '') {
      return { sentiment: 'Neutral', confidence: 1.0 };
    }
    
    const cleanedText = preprocessText(reviewText);
    
    // Handle case where preprocessing results in empty string
    if (cleanedText === '') {
      return { sentiment: 'Neutral', confidence: 1.0 };
    }
    
    // Get classifications with probabilities
    const classifications = classifier.getClassifications(cleanedText);
    
    if (classifications && classifications.length > 0) {
      // Sort by probability (highest first)
      classifications.sort((a, b) => b.value - a.value);
      
      const topClassification = classifications[0];
      const confidence = topClassification.value;
      
      // Validate that the classification is one of our expected values
      if (['Positive', 'Neutral', 'Negative'].includes(topClassification.label)) {
        return { 
          sentiment: topClassification.label, 
          confidence: confidence,
          allScores: classifications.map(c => ({ sentiment: c.label, score: c.value }))
        };
      } else {
        // Log unexpected classification for debugging
        console.warn(`Unexpected classification result: ${topClassification.label} for text: ${reviewText}`);
        return { sentiment: 'Neutral', confidence: 0.5 };
      }
    } else {
      return { sentiment: 'Neutral', confidence: 0.5 };
    }
  } catch (error) {
    console.error('Error classifying sentiment for text:', reviewText, error);
    return { sentiment: 'Neutral', confidence: 0.0 };
  }
}

/**
 * Classify the sentiment of a review text (simplified version for backward compatibility)
 * @param {string} reviewText - The raw review text to classify
 * @returns {string} - The predicted sentiment ('Positive', 'Neutral', or 'Negative')
 */
export function classifySentiment(reviewText) {
  const result = classifySentimentWithConfidence(reviewText);
  return result.sentiment;
}

// Initialize classifier on load
initClassifier();

export default {
  initClassifier,
  classifySentiment
};
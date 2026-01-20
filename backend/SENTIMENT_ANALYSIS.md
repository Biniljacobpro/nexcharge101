# Sentiment Analysis Implementation

This document explains the implementation of the Naive Bayesian Classifier for sentiment analysis of user review comments in the NexCharge EV Charging Management System.

## Overview

The sentiment analysis system automatically classifies user review comments into three categories:
- **Positive**: Favorable reviews expressing satisfaction
- **Neutral**: Reviews without strong positive or negative sentiment
- **Negative**: Reviews expressing dissatisfaction or issues

This classification helps station managers understand customer sentiment and identify areas for improvement.

## Implementation Details

### 1. Data Model

The Review model was updated to include new sentiment classification fields:

```javascript
sentimentClassification: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: 'Neutral',
    index: true
},
sentimentConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
}
```

Key features:
- Uses an enum to restrict values to the three sentiment categories
- Defaults to 'Neutral' if classification fails or is pending
- Indexed for faster queries and filtering
- Includes confidence scoring for identifying uncertain classifications

### 2. Sentiment Classifier Service

Located at `backend/src/services/sentimentClassifier.js`, this service implements the enhanced Naive Bayes classification logic.

#### Dependencies
- Uses the `natural` Node.js library for machine learning capabilities

#### Enhanced Training Data
The classifier is trained with an expanded dataset of diverse sample phrases for each sentiment category:

**Positive Examples:**
- "Excellent charging experience, very fast!"
- "Great service and clean station"
- "The station was great!"
- "Charger worked perfectly"
- Single words: "good", "great", "excellent", "perfect", "amazing", etc.

**Neutral Examples:**
- "It charged fine."
- "The station was okay"
- "Charging took the expected time"
- Single words: "okay", "fine", "average", "normal", "standard", etc.

**Negative Examples:**
- "Charger was broken."
- "Very slow charging speed"
- "Poor maintenance of the station"
- Single words: "bad", "terrible", "awful", "horrible", "broken", etc.

#### Advanced Features

1. **Confidence Scoring**: The classifier now returns confidence scores, allowing you to identify low-confidence classifications that might need manual review.

2. **N-gram Features**: Enhanced preprocessing includes bigrams (word pairs) for better context understanding.

3. **Improved Text Preprocessing**:
   - Converting to lowercase
   - Removing punctuation and numbers
   - Tokenizing text
   - Stemming (reduces words to root form)
   - Adding bigrams for context

#### Key Functions

1. `initClassifier()`: Initializes and trains the Naive Bayes classifier
2. `classifySentiment(reviewText)`: Classifies the sentiment of a review text (simplified version)
3. `classifySentimentWithConfidence(reviewText)`: Enhanced version that returns sentiment with confidence score

### 3. Integration Points

#### Review Creation
When a new review is created, the sentiment is automatically classified with confidence scoring:

```javascript
// In review.controller.js
const sentimentResult = classifySentimentWithConfidence(comment || '');
const sentiment = sentimentResult.sentiment;
const confidence = sentimentResult.confidence;

const review = new Review({
  // ... other fields
  sentimentClassification: sentiment,
  sentimentConfidence: confidence
});
```

#### Review Updates
When a review comment is updated, the sentiment is reclassified:

```javascript
if (comment !== undefined) {
  review.comment = comment;
  // Reclassify sentiment when comment is updated
  review.sentimentClassification = classifySentiment(comment);
}
```

#### Low Confidence Monitoring
Reviews with low confidence classifications are logged for monitoring:

```javascript
// Log low confidence classifications for monitoring
if (confidence < 0.7) {
  console.log(`Low confidence sentiment classification (${confidence.toFixed(2)}) for review: "${comment}" -> ${sentiment}`);
}
```

### 4. API Endpoints

#### Get Station Reviews with Sentiment Filtering
- **Endpoint**: `GET /api/reviews/station/:stationId`
- **Query Parameter**: `sentiment` (optional)
- **Example**: `GET /api/reviews/station/123?sentiment=Positive`

#### Enhanced Sentiment Analytics
- **Endpoint**: `GET /api/station-manager/analytics/sentiment`
- **Query Parameter**: `stationId` (optional)
- **Response**: Object with detailed sentiment statistics including confidence metrics

```json
{
  "success": true,
  "data": {
    "totalReviews": 26,
    "Positive": 15,
    "Neutral": 8,
    "Negative": 3,
    "confidenceStats": {
      "averageConfidence": 0.85,
      "lowConfidenceCount": 2,
      "highConfidenceCount": 24
    }
  }
}
```

### 5. Frontend Integration

The frontend uses the sentiment data in two main areas:

#### Station Details Page
- Reviews display their sentiment classification with color-coded indicators
- Filter buttons allow users to view only Positive, Neutral, or Negative reviews
- Enhanced UI with modern, compact design featuring:
  - Tab-based filtering
  - Subtle sentiment indicators (colored dots)
  - Compact review cards with improved visual hierarchy
  - Like/Dislike buttons with cleaner styling

#### Station Manager Dashboard
- Analytics section shows sentiment distribution with visual cards
- Color-coded display (green for Positive, gray for Neutral, red for Negative)
- Detailed statistics including confidence metrics

## Technical Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│   Review Model  │◄───┤  Review Controller   │◄───┤  Review Routes   │
│                 │    │                      │    │                  │
│ sentimentClass. │    │ classifySentiment()  │    │ Filter by        │
│ sentimentConf.  │    │ w/ Confidence        │    │ sentiment param  │
└─────────────────┘    └──────────────────────┘    └──────────────────┘
         ▲                                         ┌──────────────────┐
         │                                         │ Low Confidence   │
┌─────────────────┐    ┌──────────────────────┐    │ Logging          │
│ Sentiment Class.│◄───┤ Station Manager Ctrl.│◄───┤                  │
│ Service         │    │                      │    │ /analytics/      │
│                 │    │ getSentimentAnalyt.  │    │ sentiment        │
│ - initClassif.  │    │ w/ Confidence Stats  │    │                  │
│ - classifySent. │    │                      │    └──────────────────┘
│ w/ Confidence   │    │                      │
└─────────────────┘    └──────────────────────┘
```

## Extending the System

### Adding More Training Data
To improve classification accuracy, add more examples to the training data in `sentimentClassifier.js`:

```javascript
const trainingData = [
  // Existing data...
  ["New positive example", "Positive"],
  ["New neutral example", "Neutral"],
  ["New negative example", "Negative"]
];
```

### Modifying Classification Logic
The system can be enhanced by:
1. Improving text preprocessing
2. Using more sophisticated NLP techniques
3. Implementing confidence scoring
4. Adding support for more sentiment categories

## Performance Considerations

1. **Database Indexing**: The sentimentClassification field is indexed for fast filtering
2. **Caching**: The trained classifier is initialized once when the server starts
3. **Efficient Queries**: Aggregation pipelines are used for analytics endpoints
4. **Confidence Monitoring**: Low confidence classifications are logged for review

## Testing

The system has been tested with various review examples to ensure accurate classification. The expanded training data now covers:
- Common phrases users might write in their reviews
- Single-word reviews like "bad", "good", etc.
- Context-specific phrases common in EV charging reviews

## Recent Enhancements

### High-End Naive Bayes Mode Implementation

1. **Improved Training Data Quality**
   - Expanded training dataset with more diverse examples
   - Added specific single-word examples for each sentiment category
   - Enhanced context-specific phrases common in EV charging reviews

2. **Advanced Features for Higher Accuracy**
   - **Confidence Scoring**: Classifier now returns confidence scores to identify uncertain classifications
   - **N-gram Features**: Enhanced preprocessing includes bigrams (word pairs) for better context understanding
   - **Stemming**: Text preprocessing now includes stemming to reduce words to their root forms

3. **Enhanced Analytics**
   - Analytics endpoint provides detailed statistics including confidence metrics
   - Low confidence classifications are logged for monitoring
   - Detailed sentiment distribution with confidence statistics

4. **Frontend Redesign**
   - Modern, compact, and engaging Station Reviews section
   - Tab-based filtering for better user experience
   - Improved review cards with subtle sentiment indicators
   - Better action buttons and engagement features

These enhancements make the sentiment analysis much more accurate and robust. The classifier now better handles:
- Single word reviews like "bad", "good", etc.
- Context-specific phrases common in EV charging reviews
- Provide confidence scores to identify uncertain classifications
- Offer detailed analytics for station managers

The system maintains backward compatibility while providing these advanced features.

## Future Enhancements

1. **Continuous Learning**: Implement feedback mechanisms to improve classification over time
2. **Multilingual Support**: Extend to support reviews in multiple languages
3. **Advanced NLP**: Integrate with more sophisticated NLP libraries for better accuracy
4. **Sentiment Trend Analysis**: Add time-based sentiment analysis to identify trends
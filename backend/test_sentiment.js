const natural = require('natural');
const { classifySentiment } = require('./src/services/sentimentClassifier.js');

// Test the classifier with the word "bad"
console.log('Classification of "bad":', classifySentiment('bad'));
console.log('Classification of "Bad":', classifySentiment('Bad'));
console.log('Classification of "good":', classifySentiment('good'));
console.log('Classification of "excellent":', classifySentiment('excellent'));
console.log('Classification of "broken":', classifySentiment('broken'));
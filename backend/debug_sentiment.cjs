const { classifySentiment } = require('./src/services/sentimentClassifier.js');

// Test various inputs that might be sent to the classifier
console.log('Testing sentiment classification:');
console.log('--------------------------------');

// Test the exact word "bad"
console.log('Classification of "bad":', classifySentiment('bad'));

// Test with whitespace
console.log('Classification of " bad " (with spaces):', classifySentiment(' bad '));

// Test empty string
console.log('Classification of empty string:', classifySentiment(''));

// Test null/undefined
console.log('Classification of null:', classifySentiment(null));

// Test with punctuation
console.log('Classification of "bad!":', classifySentiment('bad!'));

// Test with mixed case
console.log('Classification of "Bad":', classifySentiment('Bad'));

// Test with numbers
console.log('Classification of "bad123":', classifySentiment('bad123'));

// Test with special characters
console.log('Classification of "bad@#$":', classifySentiment('bad@#$'));

// Test some other common negative words
console.log('Classification of "terrible":', classifySentiment('terrible'));
console.log('Classification of "awful":', classifySentiment('awful'));
console.log('Classification of "horrible":', classifySentiment('horrible'));

// Test some positive words
console.log('Classification of "good":', classifySentiment('good'));
console.log('Classification of "great":', classifySentiment('great'));
console.log('Classification of "excellent":', classifySentiment('excellent'));

// Test some neutral words
console.log('Classification of "okay":', classifySentiment('okay'));
console.log('Classification of "fine":', classifySentiment('fine'));
// Simple script to check how reviews are stored in the database
console.log('To check what is stored in the database, you would need to connect to MongoDB directly.');
console.log('You can use a MongoDB client or the MongoDB shell to check the reviews collection.');
console.log('');
console.log('Example MongoDB query:');
console.log('use your_database_name');
console.log('db.reviews.find({comment: "bad"}).pretty()');
console.log('');
console.log('Or to see all reviews with their sentiment classification:');
console.log('db.reviews.find({}, {comment: 1, sentimentClassification: 1, createdAt: 1}).sort({createdAt: -1}).limit(10).pretty()');
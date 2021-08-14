const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./payme-node-key.json");
const process = require('process')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const deleteQueryBatch = async (db, query, resolve) => {
    const snapshot = await query.get();
  
    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve();
      return;
    }
  
    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  
    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve);
    });
}
  

const processTasks = async () => {
    const checksRef = db.collection('subtasks')
    const noneAfterDate = moment().add(-1, 'day').set('hour', 2).set('minute', 0).toDate()
    const expiredChecksQuery = await checksRef.where('expiredDate', '<', noneAfterDate)   
    
    deleteQueryBatch(db, expiredChecksQuery, () => {
        console.log('Delete successful!')
    })
    
}

processTasks()
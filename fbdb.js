const { MongoClient } = require("mongodb");

class FBDB {
    constructor()
    {
        // Do nothing in the constructor
        const uri = "mongodb+srv://stampgen:1Wwfq6S3GcT0rlgL@payme.oq9wb4z.mongodb.net/?retryWrites=true&w=majority";
        this.client = new MongoClient(uri);
        this.db = this.client.db('payme')
        return this
    }
    collection(collectionName)
    {
        this.collection = this.db.collection(collectionName)
        return this
    }
    doc(docId)
    {
        this.docId = docId
        return this
    }
    get()
    {
        if (this.docId)
        {
            return new Promise((resolve, reject) => {
                // If the docId is set, this method will get and return one document with the specified docId
                const query = {docId: this.docId}
                const options = {}
                this.collection.findOne(query, options).then(
                    res => {
                        // Imitate the querySnapshot object
                        let querySnapshot = {
                            exists: true,
                            data: () => {return res}
                        }
                        resolve(querySnapshot)
                    },
                    err => {
                        console.log('An error occurred while trying to fetch docId ' + this.docId)
                        console.log(err)
                        let querySnapshot = {
                            exists: false,
                            doc: {}
                        }
                        reject(querySnapshot)
                    }
                ).finally(() => this.closeConn())
            })
        }
    }
    closeConn()
    {
        try {
            this.client.close()
        } catch (e)
        {
            console.log('Error while trying to close the connection')
            console.log(e)
        }
    }
}

new FBDB().collection('test').doc('test').get().then((querySnapshot) => {
    let data = querySnapshot.data()
    console.log(data)
})
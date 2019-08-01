class Firestorage {
	constructor(sName) {
		if (firebase === undefined) {
			throw "firebase is undefined";
		}
		// Your web app's Firebase configuration
		const firebaseConfig = {
			apiKey: "AIzaSyDRINvAGWQVjskeZsJNtnU_PsFuADCrp1s",
			authDomain: "llamavox.firebaseapp.com",
			databaseURL: "https://llamavox.firebaseio.com",
			projectId: "llamavox",
			storageBucket: "llamavox.appspot.com",
			messagingSenderId: "654528791640",
			appId: "1:654528791640:web:28d574b8a638a3d8",
		};
		// Initialize Firebase
		firebase.initializeApp(firebaseConfig);
		this.db_ = firebase.firestore();
		this.db_.enablePersistence()
			.catch((error) => {
				if (error.code === "failed-precondition") {
					// Multiple tabs open, persistence can only be enabled
					// in one tab at a a time.
					// ...
				} else if (error.code === "unimplemented") {
					// The current browser does not support all of the
					// features required to enable persistence
					// ...
				}
			});
		this.name_ = sName;
	}

	collectionReference() {
		return this.db_.collection(this.name_);
	}

	setItem(sKey, sText, fCallback) {
		// fCallback(error) or return promise()
		const promise = this.collectionReference().doc(sKey).set({
			text: sText,
		});
		if (fCallback) {
			promise.then(() => {
				fCallback();
			}).catch(error => {
				fCallback(error);
			});
		} else {
			return promise;
		}
	}

	removeItem(sKey, fCallback) {
		// fCallback(error) or return promise()
		const documentReference = this.collectionReference().doc(sKey);
		const promise = documentReference.delete();
		if (fCallback) {
			promise.then(() => {
				fCallback();
			}).catch(error => {
				fCallback(error);
			});
		} else {
			return promise;
		}
	}

	getItem(sKey, fCallback) {
		// fCallback(error, text) or return promise(text)
		// cache first to make it faster
		const documentReference = this.collectionReference().doc(sKey);
		const promise = documentReference.get({source: "cache"}).then(documentSnapshot => {
			if (documentSnapshot.exists) {
				return documentSnapshot.data().text;
			} else {
				const newPromise = documentReference.get({source: "server"}).then(documentSnapshot => {
					return documentSnapshot.data().text;
				});
				return newPromise;
			}
		});
		if (fCallback) {
			promise.then((text) => {
				fCallback(undefined, text);
			}).catch(error => {
				fCallback(error);
			});
		} else {
			return promise;
		}
	}

	keys(fCallback) {
		// fCallback(error, asKeys) or return promise(asKeys)
		const promise = this.collectionReference().get().then(querySnapshot => {
			return querySnapshot.docs.map(eachDocumentSnapshot => eachDocumentSnapshot.id);
		});
		if (fCallback) {
			promise.then((asKeys) => {
				fCallback(undefined, asKeys);
			}).catch(error => {
				fCallback(error);
			});
		} else {
			return promise;
		}
	}
}


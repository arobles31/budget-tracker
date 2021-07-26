let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);


// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `(any new item you want to add)`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_transacion', { autoIncrement: true });
};


// upon a successful 
request.onsuccess = function (event) {
    // save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploaditems() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransacion();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};


// This function will be executed if we attempt to submit a new items and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transacion'], 'readwrite');

    // access the object store for `new_transacion`
    const transacionObjectStore = transaction.objectStore('new_transacion');

    // add record to your store with add method
    transacionObjectStore.add(record);
}


function uploadTransacion() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transacion'], 'readwrite');
  
    // access your object store
    const transacionObjectStore = transaction.objectStore('new_transacion');
  
    // get all records from store and set to a variable
    const getAll = transacionObjectStore.getAll();                           
  
// upon a successful .getAll() execution, run this function
getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {                                   
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_transacion'], 'readwrite');
          // access the items object store
          const transacionObjectStore = transaction.objectStore('new_transacion');
          // clear all items in your store
          transacionObjectStore.clear();

          alert('All transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
  }

 window.addEventListener('online', uploadTransacion);
function dbVersion() {
    return 10;
}

function dbName(){
	return "coinsdb1";
}

function objectStoreName(){
	return "dt1";
}

function retrieveStock(c, coins, url, price) {

    fetch(url).then(function(response) {
        try {

            response.json().then(

                function(data) {
                    var a = data;
                    var parsedPrice = 0;

                    for (let [key, value] of Object.entries(coins)) {

                        parsedPrice = parsedPrice + Number(value) / Number(a[key]);

                    }

                    c(parsedPrice, coins, url, price);
                }

            );

        } catch (err) {}
    });

}

function tryCreateDb(){
	
	var d = self.indexedDB.open(dbName(), dbVersion(), function(){
		event.target.result.createObjectStore(objectStoreName(), {
            keyPath: 'id'
        });
		
	});

    d.onupgradeneeded = event => {

        event.target.result.createObjectStore(objectStoreName(), {
            keyPath: 'id'
        });

    };

    d.onerror = function(event) {
        console.log('[onerror]', event);
    };
	
}


tryCreateDb();

self.addEventListener('activate', event => {

	tryCreateDb();
    


});

self.addEventListener('install', event => {
	event.waitUntil(self.skipWaiting());

});


function updateDb(url, coins, price){

    var request = self.indexedDB.open(dbName(), dbVersion());

    request.onsuccess = function(evt) {

        var db = evt.target.result;
        var transaction = db.transaction(objectStoreName(), 'readwrite');

        transaction.onsuccess = function(event) {
            
        };

        var store = transaction.objectStore(objectStoreName());

        if (url) {
        		console.log('storing coins with price: ' + price);
        		console.log(coins);
        		console.log('');
        	
            var db_op_req = store.put({
                id: 0,
                url: url,
                coins: coins,
                price: price
            });
        }

    };

}

self.addEventListener('message', function(event) {

	
	var request = self.indexedDB.open(dbName(), dbVersion());
	var url = event.data.url;
	var coins =  event.data.coins;

	request.onerror = function(evt){
		console.log(evt);
	}
	
    request.onsuccess = function(evt) {

        var db = evt.target.result;
        var transaction = null;
        
        
        try {

        		transaction = db.transaction(objectStoreName(), 'readwrite');

        } catch (err) {
        		tryCreateDb();
        		return;
        }
        

        var store = transaction.objectStore(objectStoreName());
        store.get(0).onsuccess = function(event) {

        		var cns = event.target.result;
        	
            function sendOldValueToBrowser(c, cns, u, oldValue) {
            	
	            	if(self.clients){
	                    self.clients.matchAll().then(function(clients) {
	                        clients.forEach(function(client) {
	                        	
	                        	
	                            client.postMessage({
	                                "oldprice": oldValue
	                            });
	                            
	                            
	                            console.log('send old value (' +  oldValue + ')  to browser: ');
	                            console.log(cns);
	                            console.log('');
	                            updateDb(url, coins, c);
	                            
	                        })
	                    });
	            	}

            };

            if(!event.target.result){
            		updateDb(url, coins, 0);
            }
            
            	retrieveStock(sendOldValueToBrowser, event.target.result.coins, event.target.result.url, event.target.result.price);

        };

    };
	
	
	
	
	
	
	

});

self.addEventListener("fetch", function(event) {
    
});

self.addEventListener('periodicsync', (pevent) => {

    var request = self.indexedDB.open(dbName(), dbVersion());

    request.onsuccess = function(evt) {

        var db = evt.target.result;
        var transaction = db.transaction(objectStoreName(), 'readwrite');

        var store = transaction.objectStore(objectStoreName());

        store.get(0).onsuccess = function(event) {

            function showNotification(c) {
                
                c = c.toPrecision(6);
                
                var options = {
                    body: 'Latest value of portfolio is ' + c,
                    icon: 'images/og-img.png',
                    vibrate: [100, 50, 100],
                    data: {
                        dateOfArrival: Date.now(),
                        primaryKey: 1
                    },
                    actions: [{
                        action: 'explore',
                        title: 'Show current price changes',
                        icon: 'images/og-img.png'
                    }]
                };

                pevent.target.registration.showNotification('Crypto notification!', options);

            };

            retrieveStock(showNotification, event.target.result.coins, event.target.result.url, event.target.result.price);

        };

    };

});
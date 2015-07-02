// Associate navigation tabs with appropriate variables
var encryptNav = document.getElementById('encryptNav');
var decryptNav = document.getElementById('decryptNav');
var keypairNav = document.getElementById('keypairNav');
var keysNav = document.getElementById('keysNav');
var exportNav = document.getElementById('exportNav');
var importNav = document.getElementById('importNav');

// Associate action buttons with appropriate variables
var encryptButton = document.getElementById('encryptButton');
var decryptButton = document.getElementById('decryptButton');
var saveButton = document.getElementById('saveButton');
var delButton = document.getElementById('delButton');
var useButton = document.getElementById('useButton');
var loginButton = document.getElementById('loginButton');

// Associate the representative content divs with appropriate variables
var encrypt = document.getElementById('encrypt');
var decrypt = document.getElementById('decrypt');
var keypair = document.getElementById('keypair');
var keys = document.getElementById('keys');

// Associate the various miscellaneous input fields with appropriate variables 
var keySelect = document.getElementById('keySelect');
var usernameInput = document.getElementById('usernameInput');
var passwordInput = document.getElementById('passwordInput');

// Associate the output text areas for the public and private keys
var outputPublic = document.getElementById('outputPublic');
var outputPrivate = document.getElementById('outputPrivate');

// Initialize container array for saved Public Keys
var publicKeys = [];

// Alias for accessing OpenPGP library, Chrome app storage, Chrome filesystem access
var openpgp = window.openpgp;
var storage = chrome.storage.local;
var fileSystem = chrome.fileSystem;

encryptNav.onclick = function () {
    encryptNav.className = "active";
    decryptNav.className = "";
    keypairNav.className = "";
    keysNav.className = "";

    encrypt.style.display = "initial";
    decrypt.style.display = "none";
    keypair.style.display = "none";
    keys.style.display = "none";
};

decryptNav.onclick = function () {
    encryptNav.className = "";
    decryptNav.className = "active";
    keypairNav.className = "";
    keysNav.className = "";

    encrypt.style.display = "none";
    decrypt.style.display = "initial";
    keypair.style.display = "none";
    keys.style.display = "none";
};

keypairNav.onclick = function () {
    encryptNav.className = "";
    decryptNav.className = "";
    keypairNav.className = "active";
    keysNav.className = "";

    encrypt.style.display = "none";
    decrypt.style.display = "none";
    keypair.style.display = "initial";
    keys.style.display = "none";
};

keysNav.onclick = function () {
    encryptNav.className = "";
    decryptNav.className = "";
    keypairNav.className = "";
    keysNav.className = "active";

    encrypt.style.display = "none";
    decrypt.style.display = "none";
    keypair.style.display = "none";
    keys.style.display = "initial";
};

importNav.onclick = function () {
    fileSystem.chooseEntry ({
        type: 'openFile', accepts:[{
            extensions: ['cpgp']
        }]
    }, function (fileEntry) {
        if (!fileEntry) {
            console.log("Either a file wasn't selected or an error occurred.");
        } else {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var readResult = e.target.result;
                    var readResults = readResult.split('\n');
                    storage.set({
                        'hasAccount': 1,
                        'username': readResults[0],
                        'password': readResults[1],
                        'privateKey': JSON.parse(readResults[2]),
                        'publicKey': JSON.parse(readResults[3]),
                        'publicKeys': JSON.parse(readResults[4])
                    });
                    loginButton.innerHTML = 'Login';
                    
                };
                reader.readAsText(file);
            });
        }
    });
};

exportNav.onclick = function () {
    fileSystem.chooseEntry({type: 'saveFile', suggestedName: 'export.cpgp'},
        function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function (e) {
                    console.log('file exported successfully - log: ' + e.toString());
                };
                fileWriter.onerror = function (e) {
                    console.log('error: ' + e.toString());
                };
                
                storage.get(['username', 'password', 'privateKey', 'publicKey', 'publicKeys'], function (result) {
                    var fileOutput = '';
                    fileOutput += result.username + '\n';
                    fileOutput += result.password + '\n';
                    fileOutput += JSON.stringify(result.privateKey) + '\n';
                    fileOutput += JSON.stringify(result.publicKey) + '\n';
                    fileOutput += JSON.stringify(result.publicKeys) + '\n'; 
                    fileWriter.write(new Blob([fileOutput], {type: 'text/plain'})); 
                });
            }, function (e) {
                alert('error: ' + e.toString());
            });
        }
    );
};

encryptButton.onclick = function () {
    var key = document.getElementById('encodePublicKey').value;
    var message = document.getElementById('inputUnencodedMessage').value;
    var output = document.getElementById('outputEncodedMessage');
    var publicKey = openpgp.key.readArmored(key);

    openpgp.encryptMessage(publicKey.keys, message).then(function (pgpMessage) {
        output.value = pgpMessage;
    }).catch(function (error) {
        console.log(error);
    });
};

decryptButton.onclick = function () {
    var key = document.getElementById('decodePrivateKey').value;

    storage.get('password', function (result) {
        var message = document.getElementById('inputEncodedMessage').value;
        var output = document.getElementById('outputDecodedMessage');
        var privateKey = openpgp.key.readArmored(key).keys[0];

        privateKey.decrypt(result.password);
        message = openpgp.message.readArmored(message);

        openpgp.decryptMessage(privateKey, message).then(function (plainMessage) {
            output.value = plainMessage;
        }).catch(function (error) {
            console.log(error);
        });
    });
};

saveButton.onclick = function () {
    var tempKey = { label: document.getElementById('keyLabel').value, content: document.getElementById('keyContent').value };
    publicKeys.push(tempKey);

    storage.set({ 'publicKeys': publicKeys });

    var tempOption = document.createElement('option');
    tempOption.text = tempKey.label;
    keySelect.add(tempOption);
};

useButton.onclick = function () {
    document.getElementById('encodePublicKey').value = document.getElementById('keyContent').value;
};

delButton.onclick = function () {
    publicKeys.splice(keySelect.selectedIndex, 1);
    storage.set({ 'publicKeys': publicKeys });
    keySelect.remove(keySelect.selectedIndex);
    document.getElementById('keyLabel').value = "";
    document.getElementById('keyContent').value = "";
    keySelect.selectedIndex = -1;
};

loginButton.onclick = function () {
    var username = usernameInput.value;
    var password = passwordInput.value;

    storage.get('hasAccount', function (result) {
        if (!result.hasAccount) {
            storage.set({
                'hasAccount': 1, 
                'username': CryptoJS.SHA3(username).toString(), 
                'password': CryptoJS.SHA3(password).toString(), 
                'publicKeys': ''
            });
            keypairNav.style.display = 'initial';
            keysNav.style.display = 'initial';
            exportNav.style.display = 'initial';
            importNav.style.display = 'initial';
            document.getElementById('usernameInputGroup').style.display = 'none';
            document.getElementById('passwordInputGroup').style.display = 'none';
            loginButton.style.display = 'none';

            openpgp.generateKeyPair({
                numBits: 2048,
                userId: usernameInput.value,
                passphrase: result.password
            }).then(function (keypair) {
                var publicKey = keypair.publicKeyArmored;
                var privateKey = keypair.privateKeyArmored;

                var encryptedPublicKey = CryptoJS.AES.encrypt(publicKey, passwordInput.value);
                var encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, passwordInput.value);
                outputPublic.value = publicKey;
                outputPrivate.value = privateKey;

                storage.set({ 'publicKey': encryptedPublicKey }); 
                storage.set({ 'privateKey': encryptedPrivateKey });
            }).catch(function (error) {
                console.log(error);
            });
        } else {
            storage.get(['username', 'password'], function (result) {
                if (CryptoJS.SHA3(username).toString() == result.username &&
                    CryptoJS.SHA3(password).toString() == result.password) {
                    keypairNav.style.display = 'initial';
                    keysNav.style.display = 'initial';
                    exportNav.style.display = 'initial';
                    importNav.style.display = 'initial';
                    document.getElementById('usernameInputGroup').style.display = 'none';
                    document.getElementById('passwordInputGroup').style.display = 'none';
                    loginButton.style.display = 'none';

                    storage.get(['publicKey', 'password'], function (result) {
                        outputPublic.value = CryptoJS.AES.decrypt(result.publicKey, passwordInput.value, { iv: result.publicKey.iv }).toString(CryptoJS.enc.Utf8);
                    });

                    storage.get(['privateKey', 'password'], function (result) {
                        outputPrivate.value = CryptoJS.AES.decrypt(result.privateKey, passwordInput.value, { iv: result.privateKey.iv }).toString(CryptoJS.enc.Utf8);
                    });
                }
            });
        }
    });

    usernameInput.value = '';
    passwordInput.value = '';
};

keySelect.onchange = function () {
    document.getElementById('keyLabel').value = publicKeys[keySelect.selectedIndex].label;
    document.getElementById('keyContent').value = publicKeys[keySelect.selectedIndex].content;
};

window.onload = function () {
    storage.get('publicKeys', function (result) {
        if (result.publicKeys !== '') {
            publicKeys = result.publicKeys;
            for (var i = 0; i < publicKeys.length; i++) {
                var tempOption = document.createElement('option');
                tempOption.text = publicKeys[i].label;
                keySelect.add(tempOption);
            }
            keySelect.selectedIndex = -1;
        }
    });

    storage.get('hasAccount', function (result) {
        if (!result.hasAccount) {
            loginButton.innerHTML = "Create";
        }
    });
};

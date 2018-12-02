/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/**
 * Initializes the Functions Web quickstart app.
 */
function FunctionsQuickstart() {
  this.signInButton = document.getElementById('sign-in-button');
  this.signOutButton = document.getElementById('sign-out-button');
  this.splashPage = document.getElementById('page-splash');
  this.messageText = document.getElementById('message-text');
  this.addMessageButton = document.getElementById('add-message-button');
  this.firstNumber = document.getElementById('first-number');
  this.secondNumber = document.getElementById('second-number');
  this.addNumbersButton = document.getElementById('send-addition-button');
  this.messageContainer = document.getElementById('message-container');

  // Add Click events to buttons.
  this.signInButton.addEventListener('click', this.signIn);
  this.signOutButton.addEventListener('click', this.signOut);
  this.addMessageButton.addEventListener('click', this.addMessage.bind(this));
  this.addNumbersButton.addEventListener('click', this.addNumbers.bind(this));
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  // Listen for new Messages to be displayed.
  firebase.database().ref('/messages').limitToLast(10).on('child_added', this.onNewMessage.bind(this));
}

// Adds two numbers by calling the `addNumbers` server-side function.
FunctionsQuickstart.prototype.addNumbers = function() {
  var firstNumber = parseFloat(this.firstNumber.value);
  var secondNumber = parseFloat(this.secondNumber.value);
  var addNumbersButton = this.addNumbersButton;
  addNumbersButton.disabled = true;
  // [START callAddFunction]
  var sendNotification = firebase.functions().httpsCallable('addNumbers');
  sendNotification({firstNumber: firstNumber, secondNumber: secondNumber}).then(function(result) {
    console.log('Cloud Function called successfully.', result);
    // Read results of the Cloud Function.
    var firstNumber = result.data.firstNumber;
    var secondNumber = result.data.secondNumber;
    var operationResult = result.data.operationResult;
    var operator = result.data.operator;
    // [START_EXCLUDE]
    window.alert('Here is the result of the formula: ' + firstNumber + ' '
        + operator + ' ' + secondNumber + ' = ' + operationResult);
    addNumbersButton.disabled = false;
    // [END_EXCLUDE]
  }).catch(function(error) {
    // Getting the Error details.
    var code = error.code;
    var message = error.message;
    var details = error.details;
    // [START_EXCLUDE]
    console.error('There was an error when calling the Cloud Function', error);
    window.alert('There was an error when calling the Cloud Function:\n\nError Code: '
        + code + '\nError Message:' + message + '\nError Details:' + details);
    addNumbersButton.disabled = false;
    // [END_EXCLUDE]
  });
  // [END callAddFunction]
};


// Adds a message to the Realtime Database by calling the `addMessage` server-side function.
FunctionsQuickstart.prototype.addMessage = function() {
  var messageTextInput = this.messageText;
  var messageText = messageTextInput.value;
  var addMessageButton = this.addMessageButton;
  addMessageButton.disabled = true;
  // [START callAddMessageFunction]
  // [START callAddMessageFunctionWithError]
  var addMessage = firebase.functions().httpsCallable('addMessage');
  addMessage({text: messageText}).then(function(result) {
    // Read result of the Cloud Function.
    var sanitizedMessage = result.data.text;
    // [END callAddMessageFunctionWithError]
    // [START_EXCLUDE silent]
    if (messageText !== sanitizedMessage) {
      window.alert('You were naughty. Your message was sanitized to:\n\n' + sanitizedMessage);
    }
    messageTextInput.value = '';
    addMessageButton.disabled = false;
  // [START catchError]
  }).catch(function(error) {
    // Getting the Error details.
    var code = error.code;
    var message = error.message;
    var details = error.details;
    // [START_EXCLUDE]
    console.error('There was an error when calling the Cloud Function', error);
    window.alert('There was an error when calling the Cloud Function:\n\nError Code: '
        + code + '\nError Message:' + message + '\nError Details:' + details);
    addMessageButton.disabled = false;
    // [END_EXCLUDE]
    // [END_EXCLUDE]
  });
  // [END catchError]
  // [END callAddMessageFunction]
};

// Start the Firebase signs-in flow via Google account.
FunctionsQuickstart.prototype.signIn = function() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
};

// The user signs-out his Firebase account.
FunctionsQuickstart.prototype.signOut = function() {
  firebase.auth().signOut();
};

// This is called when the Firebase auth state has changed. i.e. the User has signed-in or signed-out.
FunctionsQuickstart.prototype.onAuthStateChanged = function(user) {
  if (user) {
    // When a user signs-in we remove the sign-in splash page.
    this.splashPage.style.display = 'none';
  } else {
    // Display the splash page where you can sign-in.
    this.splashPage.style.display = '';
  }
};

// This is called when a new Message has been added to the realtime Database.
FunctionsQuickstart.prototype.onNewMessage = function(snap) {
  var text = snap.val().text;
  var name = snap.val().author.name;
  var messageElement = document.createElement('div');
  messageElement.classList.add('message-element');
  var authorContainer = document.createElement('div');
  authorContainer.innerText = name;
  authorContainer.classList.add('author-container');
  var textContainer = document.createElement('div');
  textContainer.innerText = text;
  messageElement.appendChild(authorContainer);
  messageElement.appendChild(textContainer);
  this.messageContainer.insertBefore(messageElement, this.messageContainer.firstChild);
};

window.onload = function() {
  window.app = new FunctionsQuickstart();
  initApp();
};

function toggleSignIn() {
      if (firebase.auth().currentUser) {
        // [START signout]
        firebase.auth().signOut();
        // [END signout]
      } else {
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;
        if (email.length < 4) {
          alert('Please enter an email address.');
          return;
        }
        if (password.length < 4) {
          alert('Please enter a password.');
          return;
        }
        // Sign in with email and pass.
        // [START authwithemail]
        firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // [START_EXCLUDE]
          if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
          } else {
            alert(errorMessage);
          }
          console.log(error);
          document.getElementById('quickstart-sign-in').disabled = false;
          // [END_EXCLUDE]
        });
        // [END authwithemail]
      }
      document.getElementById('quickstart-sign-in').disabled = true;
    }
    /**
     * Handles the sign up button press.
     */
    function handleSignUp() {
      var email = document.getElementById('email').value;
      var password = document.getElementById('password').value;
      if (email.length < 4) {
        alert('Please enter an email address.');
        return;
      }
      if (password.length < 4) {
        alert('Please enter a password.');
        return;
      }
      // Sign in with email and pass.
      // [START createwithemail]
      firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/weak-password') {
          alert('The password is too weak.');
        } else {
          alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
      });
      // [END createwithemail]
    }
    /**
     * Sends an email verification to the user.
     */
    function sendEmailVerification() {
      // [START sendemailverification]
      firebase.auth().currentUser.sendEmailVerification().then(function() {
        // Email Verification sent!
        // [START_EXCLUDE]
        alert('Email Verification Sent!');
        // [END_EXCLUDE]
      });
      // [END sendemailverification]
    }
    function sendPasswordReset() {
      var email = document.getElementById('email').value;
      // [START sendpasswordemail]
      firebase.auth().sendPasswordResetEmail(email).then(function() {
        // Password Reset Email Sent!
        // [START_EXCLUDE]
        alert('Password Reset Email Sent!');
        // [END_EXCLUDE]
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/invalid-email') {
          alert(errorMessage);
        } else if (errorCode == 'auth/user-not-found') {
          alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
      });
      // [END sendpasswordemail];
    }
    /**
     * initApp handles setting up UI event listeners and registering Firebase auth listeners:
     *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
     *    out, and that is where we update the UI.
     */
    function initApp() {
      // Listening for auth state changes.
      // [START authstatelistener]
      firebase.auth().onAuthStateChanged(function(user) {
        // [START_EXCLUDE silent]
        document.getElementById('quickstart-verify-email').disabled = true;
        // [END_EXCLUDE]
        if (user) {
          // User is signed in.
          var displayName = user.displayName;
          var email = user.email;
          var emailVerified = user.emailVerified;
          var photoURL = user.photoURL;
          var isAnonymous = user.isAnonymous;
          var uid = user.uid;
          var providerData = user.providerData;
          // [START_EXCLUDE]
          document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
          document.getElementById('quickstart-sign-in').textContent = 'Sign out';
          document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
          if (!emailVerified) {
            document.getElementById('quickstart-verify-email').disabled = false;
          }
          // [END_EXCLUDE]
        } else {
          // User is signed out.
          // [START_EXCLUDE]
          document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
          document.getElementById('quickstart-sign-in').textContent = 'Sign in';
          document.getElementById('quickstart-account-details').textContent = 'null';
          // [END_EXCLUDE]
        }
        // [START_EXCLUDE silent]
        document.getElementById('quickstart-sign-in').disabled = false;
        // [END_EXCLUDE]
      });
      // [END authstatelistener]
      document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
      document.getElementById('quickstart-sign-up').addEventListener('click', handleSignUp, false);
      document.getElementById('quickstart-verify-email').addEventListener('click', sendEmailVerification, false);
      document.getElementById('quickstart-password-reset').addEventListener('click', sendPasswordReset, false);
    }

    /*window.onload = function() {
      initApp();
    };*/

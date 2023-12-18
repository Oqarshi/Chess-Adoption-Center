var isSendingRequests = false;
var intervalId;
var usernameCount = {}; // Object to store the count of each username and their consecutive wins
var consecutiveWinsRequired = 10; // Number of consecutive wins required

window.onload = function () {
  // Get the resultDiv element
  var resultDiv = document.getElementById('result');

  // Hide the resultDiv initially
  resultDiv.style.display = 'none';
};

function getGames() {
  // Clear result div and reset counters when a new username is entered
  var resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '';
  resultDiv.style.display = 'none'; // double-check to Hide the result div
  usernameCount = {};
  clearInterval(intervalId);

  // Show loading message
  Swal.fire({
    title: '<b>Games Loading</b>',
    html: '<b>This popup will go away once all games are loaded.<br>Tip: Press <span style="color: #f50727;">Ctrl+Shift+J</span> to see the progress bar.</b>',
    icon: 'info',
    onBeforeOpen: () => {
      Swal.showLoading();
      // Disable closing the modal by clicking outside or pressing escape
      Swal.getPopup().querySelector('button.swal2-close').setAttribute('disabled', 'true');
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false, // Hide the "OK" button
  });
  
  

  // Get the username from the input field
  var username = document.getElementById('username').value;

  fetch(`https://api.chess.com/pub/player/${username}/games/archives`, {
    headers: {
      'User-Agent': 'username: Omed: omednotfound@gmail.com',
    },
  })
    .then((response) => {
      if (!response.ok) {
        // Check for 404 response
        isSendingRequests = false;
        Swal.close();
        alert("Not a valid username!");
        location.reload();
        return;
      }
      return response.json();
    })
    .then((data) => {
      // Extract the list of URLs from the response
      var archives = data.archives;

      // Check if the user has played no games
      if (archives.length === 0) {
        isSendingRequests = false;
        Swal.close();
        alert("User has played no games.");
        
        return;
      }

      // Set the flag to indicate that requests are now being sent
      isSendingRequests = true;

      // Call the function to get details for each URL
      getGamesDetails(archives, username); // Pass the username parameter
    })
    .catch((error) => {
      // Handle errors
      console.error('Error fetching data:', error);

      // Check if the error is due to an invalid username (404 response)
      if (error.message === 'Username not found') {
        document.getElementById('result').innerHTML = 'Invalid username. Please check and try again.';
      } else {
        document.getElementById('result').innerHTML =
          'Error fetching data. Please check your username and try again.';
      }

      // Close the loading modal on error
      Swal.close();
    });
}


function getGamesDetails(archives, username) {
  var index = 0;
  var totalRequests = archives.length;
  var intervalId = setInterval(() => {
    if (index >= totalRequests) {
      clearInterval(intervalId);
      isSendingRequests = false;

      // Show loaded message
      Swal.fire({
        title: 'Games All Loaded!',
        icon: 'success',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => {
        // Enable closing the modal after the games are loaded
        Swal.resetValidationMessage();
        Swal.getPopup().querySelector('button.swal2-close').removeAttribute('disabled');
      });

      return;
    }

    var url = archives[index];

    // Make a request to each URL with custom headers
    fetch(url, {
      headers: {
        'User-Agent': 'username: Omed: omednotfound@gmail.com'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        data.games.forEach((game) => {
          var pgnData = game.pgn;
          var whiteMatch = pgnData.match(/\[White "(.*?)"\]/i);
          var blackMatch = pgnData.match(/\[Black "(.*?)"\]/i);
          var resultMatch = pgnData.match(/\[Result "(.*?)"\]/i);
          var dateMatch = pgnData.match(/\[Date "(.*?)"\]/i);

          var whitePlayer = whiteMatch ? whiteMatch[1].trim().toLowerCase() : 'Unknown';
          var blackPlayer = blackMatch ? blackMatch[1].trim().toLowerCase() : 'Unknown';
          var gameResult = resultMatch ? resultMatch[1].trim() : 'Unknown';
          var gameDate = dateMatch ? dateMatch[1].trim() : 'Unknown';

          var lowercaseUsername = username.toLowerCase();

          if (whitePlayer === lowercaseUsername) {
            checkAndAlert(blackPlayer, gameResult, gameDate, 'white');
          } else {
            checkAndAlert(whitePlayer, gameResult, gameDate, 'black');
          }
        });
      })
      .catch((error) => {
        console.error(`Error fetching data from ${url}:`, error);
      })
      .finally(() => {
        index++;
        var progress = ((index / totalRequests) * 100).toFixed(2);
        console.log(`Progress: ${progress}% [${'='.repeat(progress / 2)}>]`);
      });
  }, 1000);
}

function checkAndAlert(opponentUsername, gameResult, gameDate, playerColor) {
  var username = document.getElementById('username').value;
  var resultDiv = document.getElementById('result');

  // Check if the game result indicates a win for the opponent
  if (
    (gameResult === '0-1' && playerColor === 'white') ||
    (gameResult === '1-0' && playerColor === 'black')
  ) {
    // Check and update the count for the opponent's username, consecutive wins, and game dates
    usernameCount[opponentUsername] = usernameCount[opponentUsername] || {
      count: 0,
      consecutiveWins: 0,
      dates: [],
    };
    usernameCount[opponentUsername].count++;

    // If the opponent's username changes, reset consecutive wins and dates
    if (
      usernameCount[opponentUsername].consecutiveWins > 0 &&
      usernameCount[opponentUsername].username !== opponentUsername
    ) {
      usernameCount[opponentUsername].consecutiveWins = 0;
      usernameCount[opponentUsername].dates = [];
    }

    // Increment consecutive wins only if it's a consecutive win
    if (
      (gameResult === '0-1' && playerColor === 'white') ||
      (gameResult === '1-0' && playerColor === 'black')
    ) {
      usernameCount[opponentUsername].consecutiveWins++;
    } else {
      // Reset consecutive wins if the streak is broken
      usernameCount[opponentUsername].consecutiveWins = 0;
    }

    // Check if the game date matches the required date
    if (
      usernameCount[opponentUsername].dates.length > 0 &&
      usernameCount[opponentUsername].dates[0] !== gameDate
    ) {
      usernameCount[opponentUsername].consecutiveWins = 0; // Reset consecutive wins if date doesn't match
    }
    // Store the game date
    usernameCount[opponentUsername].dates.unshift(gameDate);

    // Update the opponent's username
    usernameCount[opponentUsername].username = opponentUsername;

    // Check if the username has achieved the required consecutive wins
    if (usernameCount[opponentUsername].consecutiveWins === consecutiveWinsRequired) {
      // Check if the last N games were consecutive wins
      var consecutiveWins = true;
      for (var i = 1; i <= consecutiveWinsRequired; i++) {
        if (!usernameCount[opponentUsername].dates[i - 1]) {
          consecutiveWins = false;
          break;
        }
      }

      if (consecutiveWins) {
        var resultMessage = `<span style="font-weight: bold; color: #f50727;">${opponentUsername}</span> has won <span style="font-weight: bold; color: #d1b111;">${consecutiveWinsRequired}</span> games in a row, adopting <span style="font-weight: bold; color: #3fabe0;">${username}</span> on ${gameDate}.<br>`;

        resultDiv.innerHTML += resultMessage;

        // Reveal the result div
        resultDiv.style.display = 'block';

        // Add additional checks or alerts here as needed
        if (usernameCount[opponentUsername].count > 50) {
          console.log(`${opponentUsername} has a high win count (${usernameCount[opponentUsername].count}). Watch out!`);
        }
      } else {
        // Reset consecutive wins if the last N games were not consecutive
        usernameCount[opponentUsername].consecutiveWins = 0;
      }
    }
  } else {
    // Reset consecutive wins and dates if the streak is broken
    usernameCount[opponentUsername] = usernameCount[opponentUsername] || {
      count: 0,
      consecutiveWins: 0,
      dates: [],
    };
    usernameCount[opponentUsername].consecutiveWins = 0;
    usernameCount[opponentUsername].dates = [];
    usernameCount[opponentUsername].username = opponentUsername; // Update the opponent's username
    // Add additional checks or alerts here as needed

    // Example: Display a message if the opponent didn't win this game
    console.log(`${opponentUsername} did not win this game.`);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Check if the button has been clicked before
  if (localStorage.getItem("buttonClicked")) {
    // If clicked before, make the input box non-interactable
    disableInput();
  }

  // Add click event listener to the button
  document.getElementById("submitButton").addEventListener("click", function () {
    // Check if the button has been clicked before
    if (!localStorage.getItem("buttonClicked")) {
      // If not clicked before, make the input box non-interactable and store the state
      disableInput();
      localStorage.setItem("buttonClicked", true);
    }
  });

  function disableInput() {
    // Disable the input box
    document.getElementById("username").disabled = true;

    // Change the button text and disable it further
    var button = document.getElementById("submitButton");
    button.textContent = "Input Disabled";
    button.disabled = true;
    button.style.backgroundColor = "#ccc";
    button.style.cursor = "not-allowed";

  }

  // Listen for the page refresh event
  window.addEventListener("beforeunload", function () {
    // Clear the buttonClicked state from localStorage when the page is refreshed
    localStorage.removeItem("buttonClicked");
    // Display the disclaimer message
    document.getElementById("disclaimer").style.display = "block";
  });
});

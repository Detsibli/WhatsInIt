$(document).ready(function() {
  $('#search-form').on('submit', function(event) {
    event.preventDefault();
    var query = $('#search-input').val();
    var useDB = $('#db-checkbox').is(':checked');
    var useAPI = $('#api-checkbox').is(':checked');
    var $results = $('#search-results');
    $results.empty();

    if (!query) {
      return;
    }

    if (useDB) {
      $.ajax({
        url: '/search',
        type: 'POST',
        data: { q: query },
        success: function(data) {
          if (data.length > 0) {
            var $header = $('<h2>').text('Results from local database');
            var $list = $('<ul>');
            data.forEach(function(cocktail) {
              var $item = $('<li>').text(cocktail.name);
              $list.append($item);
            });
            $results.append($header, $list);
          }
        },
        error: function(err) {
          console.log(err);
        }
      });
    }

    if (useAPI) {
      $.ajax({
        url: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
        type: 'GET',
        data: { s: query },
        success: function(data) {
          if (data.drinks && data.drinks.length > 0) {
            var $header = $('<h2>').text('Results from CocktailDB API');
            var $list = $('<ul>');
            data.drinks.forEach(function(drink) {
              var $item = $('<li>').text(drink.strDrink);
              $list.append($item);
            });
            $results.append($header, $list);
          }
        },
        error: function(err) {
          console.log(err);
        }
      });
    }
  });
});

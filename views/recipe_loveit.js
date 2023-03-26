$(document).ready(function() 
{
    $('#loveit').on('click', function() 
    {
      var recipeId = recipe.id;
      $.ajax({
        url: '/loveit/' + recipeId,
        type: 'POST',
        success: function(result) 
        {
          $('#loveit-count').text(result);
        },
        error: function(err) 
        {
          console.log(err);
        }
      });
    });
});
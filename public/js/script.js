$(document).ready(function() {
console.log("linked");
// materialize things below
$(".dropdown-button").dropdown();
$(".button-collapse").sideNav();
$('select').material_select();
$("select[required]").css({display: "block", height: 0, padding: 0, width: 0, position: 'absolute'});

//should pre-select my drop down on update
// $(function() {
//     var cat="sinles";
//     $("#updatecategory").val(cat);
// });

let commentBtn = $("#addCommentButton")

var comment = {};
let form = $('#commentForm');

// form.on('submit', function(e){
//   e.preventDefault()
//   let data = form.serializeArray();
//   let url = form.attr('action')
// console.log(data)
//   $.ajax({
//     url: url,
//     method: "POST",
//     // data: {param1: 'value1'},
//     success: function(el){
//       console.log(el)
//     }
//   })
// })




// commentBtn.on('click', function(event) {
//   event.preventDefault();
//   /* Act on the event */
//   $.ajax({
//     url: '/comment',
//     method: "POST",
//     // data: {param1: 'value1'},
//     success: function(el){
//       console.log(el)
//     }
//   })
//   // .done(function() {
//   //   console.log("success");
//   // })
//   // .catch(function() {
//   //   console.log("error");
//   // })
// });










}); //end of document ready

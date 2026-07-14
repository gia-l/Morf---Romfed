(function(){
  try {
    document.title = 'Morf 4.2';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 4.2'; });
    window.MorfBuild = '4.2-familylinks-full';
  } catch(err) {}
})();

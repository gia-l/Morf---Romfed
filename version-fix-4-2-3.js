(function(){
  try {
    document.title = 'Morf 4.2.3';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 4.2.3'; });
    window.MorfBuild = '4.2.3-familylinks-full';
  } catch(err) {}
})();

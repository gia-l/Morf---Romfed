(function(){
  try {
    document.title = 'Morf 4.0';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 4.0'; });
    window.MorfBuild = '4.0-family-full';
  } catch(err) {}
})();

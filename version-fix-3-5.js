(function(){
  try {
    document.title = 'Morf 3.5';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 3.5'; });
    window.MorfBuild = '3.5-compat-full';
  } catch(err) {}
})();

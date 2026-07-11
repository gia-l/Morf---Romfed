(function(){
  try {
    document.title = 'Morf 3.4.5';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 3.4.5'; });
    window.MorfBuild = '3.4.5-compat-full';
  } catch(err) {}
})();

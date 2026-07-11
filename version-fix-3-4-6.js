(function(){
  try {
    document.title = 'Morf 3.4.6';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 3.4.6'; });
    window.MorfBuild = '3.4.6-compat-full';
  } catch(err) {}
})();

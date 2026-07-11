(function(){
  try {
    document.title = 'Morf 3.4.4';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 3.4.4'; });
    window.MorfBuild = '3.4.4-scriptfix-full';
  } catch(err) {}
})();

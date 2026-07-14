(function(){
  try {
    document.title = 'Morf 4.2.1';
    document.querySelectorAll('.eyebrow').forEach(function(el){ el.textContent = 'Version 4.2.1'; });
    window.MorfBuild = '4.2.1-chunknickname-full';
  } catch(err) {}
})();

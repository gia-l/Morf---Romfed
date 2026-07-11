(function(){
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function(){
    var versionTargets = document.querySelectorAll('.eyebrow');
    versionTargets.forEach(function(el){ if(/Version 3\.4(?!\.1)/.test(el.textContent)) el.textContent = 'Version 3.4.2'; });
    window.MorfBuild = '3.4.2-button-rescue';
  });
})();

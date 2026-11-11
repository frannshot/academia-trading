/* Cuentas y sincronización de la Academia (Firebase).
   Cada persona solo puede leer y escribir sus propios datos (users/{su uid}),
   según las reglas de seguridad del proyecto de Firebase. */
(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyCUniBncR0TxTNM0OUznzy1zQQW_YLhydc",
    authDomain: "academia-trading-5c890.firebaseapp.com",
    projectId: "academia-trading-5c890",
    storageBucket: "academia-trading-5c890.firebasestorage.app",
    messagingSenderId: "692576015818",
    appId: "1:692576015818:web:c287251bb4eea461e02b33"
  };
  const KEYS=["ajustes","plan","progreso","ops","box","ema"];
  function clearLocal(){ try{ KEYS.forEach(k=>localStorage.removeItem("acad_"+k)); }catch(e){} }
  if(!firebaseConfig || !window.firebase){ window.AcadCloud={ enabled:false, ready:()=>Promise.resolve(null) }; return; }

  firebase.initializeApp(firebaseConfig);
  const auth=firebase.auth(), fs=firebase.firestore();
  try{ fs.settings({experimentalAutoDetectLongPolling:true, merge:true}); }catch(e){}
  const persisted=fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});

  /* Adaptador con la misma forma que usa la página: doc(path), collection(path) */
  function makeDB(uid){
    const base=fs.collection("users").doc(uid);
    const wrapSnap=s=>({id:s.id, exists:s.exists, data:()=>s.data(), metadata:s.metadata});
    const docRef=r=>({ id:r.id,
      get:()=>r.get().then(wrapSnap),
      set:d=>r.set(JSON.parse(JSON.stringify(d))),
      update:d=>r.set(JSON.parse(JSON.stringify(d)),{merge:true}),
      delete:()=>r.delete(),
      onSnapshot:(fn,err)=>r.onSnapshot(s=>fn(wrapSnap(s)),err) });
    return {
      doc(path){ const id=path.split("/").pop(); return docRef(base.collection("estado").doc(id)); },
      collection(name){ const c=base.collection(name); return {
        doc:id=>docRef(id?c.doc(id):c.doc()),
        onSnapshot:(fn,err)=>c.onSnapshot({includeMetadataChanges:false},s=>fn({docs:s.docs.map(d=>({id:d.id,exists:true,data:()=>d.data()})),size:s.size,empty:s.empty,metadata:s.metadata}),err)
      }; }
    };
  }

  let resolveReady; const readyP=new Promise(r=>resolveReady=r); let first=true, current=null;
  auth.onAuthStateChanged(async u=>{
    if(first){ first=false; current=u?u.uid:null; if(!u){ resolveReady(null); return; } await persisted; resolveReady(makeDB(u.uid)); return; }
    if((u?u.uid:null)!==current) location.reload();
  });

  const msg=c=>({"auth/invalid-credential":"Correo o contraseña incorrectos.","auth/wrong-password":"Correo o contraseña incorrectos.","auth/user-not-found":"Ese correo no tiene cuenta.","auth/invalid-email":"Escribe un correo válido.","auth/email-already-in-use":"Ese correo ya tiene cuenta: usa Entrar.","auth/weak-password":"La contraseña debe tener al menos 6 caracteres.","auth/too-many-requests":"Demasiados intentos. Espera unos minutos.","auth/network-request-failed":"Sin conexión. Necesitas internet para iniciar sesión."})[c]||("No se pudo completar ("+c+").");

  window.AcadCloud={
    enabled:true,
    ready:()=>readyP,
    user:()=>auth.currentUser,
    async signIn(m,p){ await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); return auth.signInWithEmailAndPassword(m,p); },
    async signUp(m,p){ await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); return auth.createUserWithEmailAndPassword(m,p); },
    reset:m=>auth.sendPasswordResetEmail(m),
    async signOut(){ clearLocal(); await auth.signOut(); location.reload(); },
    msg
  };
})();

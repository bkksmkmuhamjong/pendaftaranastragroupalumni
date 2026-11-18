/* ===== PENGATURAN: ubah 4 baris ini ===== */
const C={
  API:'https://script.google.com/macros/s/AKfycbyoiaST5h0KQC3WgsuKcMJJa_MidzQUzyW8oUZK57GUlzSBZgmj2wkz2MfIcf1c6u3I/exec',
  NOMINAL:'Rp 30.000',
  QR:'dana-qr.png',            // taruh gambar QR DANA Anda di repo dengan nama ini
  PENERIMA:'a.n. Dwi Frediawan'
};
/* ======================================== */
const $=s=>document.querySelector(s);
// [kunci, label, tipe, pilihan]  tipe: t=teks n=angka d=tanggal s=pilihan a=alamat e=email
const FD=[
['nama','Nama lengkap','t'],['nik','NIK (16 angka)','n','16'],['tempat_lahir','Tempat lahir','t'],['tgl_lahir','Tanggal lahir','d'],
['jk','Jenis kelamin','s','LAKI LAKI,PEREMPUAN'],['tb','Tinggi badan (cm)','n','2,3'],['bb','Berat badan (kg)','n','2,3'],
['visus_kanan','Visus mata kanan (mis. 5/5)','t'],['visus_kiri','Visus mata kiri (mis. 5/6)','t'],['buta_warna','Buta warna','s','YA,TIDAK'],
['domisili','Domisili (kota)','t'],['alamat','Alamat lengkap','a'],['npsn','NPSN (8 angka)','n','8'],['kota_sekolah','Kota asal sekolah','t'],
['nama_sekolah','Nama sekolah','t'],['jurusan','Jurusan','t'],['tahun_lulus','Tahun kelulusan','n','4'],
['nilai_rata','Nilai rata-rata sekolah','t'],['nilai_mtk','Nilai rata-rata matematika','t'],['source','Source (mis. ABKI TEGAL)','t'],
['hp','No. HP (WA dan telepon harus sama)','n','9,15'],['email','Email aktif','e'],['asal_bkk','Asal BKK','t']];

const api=b=>fetch(C.API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(b)}).then(r=>r.json());
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dmy=s=>s.split('-').reverse().join('/');
const ymd=s=>/^\d\d\/\d\d\/\d{4}$/.test(s)?s.split('/').reverse().join('-'):'';
function usia(s){const[y,m,d]=s.split('-').map(Number),n=new Date();let Y=n.getFullYear()-y,M=n.getMonth()+1-m,D=n.getDate()-d;
  if(D<0){M--;D+=new Date(n.getFullYear(),n.getMonth(),0).getDate()}if(M<0){Y--;M+=12}return`${Y}Tahun;${M}Bulan;${D}Hari`}

function field([k,l,t,o],v=''){
  const a=`name="${k}" required`;
  if(t=='s')return`<label>${l}<select ${a}><option value="">Pilih</option>${o.split(',').map(x=>`<option${x==v?' selected':''}>${x}</option>`).join('')}</select></label>`;
  if(t=='a')return`<label class="full">${l}<textarea ${a} rows="2">${esc(v)}</textarea></label>`;
  let x='type="text"';
  if(t=='d')x=`type="date" value="${esc(ymd(v)||v)}" max="${new Date().toISOString().slice(0,10)}"`;
  else if(t=='e')x=`type="email" value="${esc(v)}"`;
  else if(t=='n'){const[min,max]=o.split(',');x=`inputmode="numeric" pattern="[0-9]{${max?min+','+max:min}}" value="${esc(v)}"`}
  else x=`type="text" value="${esc(v)}"`;
  return`<label>${l}<input ${a} ${x}></label>`;
}
function collect(form){
  const d={};new FormData(form).forEach((v,k)=>d[k]=v.trim());
  FD.forEach(([k,,t])=>{if(t!='e'&&d[k])d[k]=d[k].toUpperCase()});
  d.usia=usia(d.tgl_lahir);d.tgl_lahir=dmy(d.tgl_lahir);
  return d;
}
const show=id=>['v1','v2','v3','v4'].forEach(v=>$('#'+v).hidden=v!=id);

/* ===== Alur pendaftar ===== */
let ID='';
$('#f1').onsubmit=e=>{e.preventDefault();
  $('#f2').innerHTML=FD.map(f=>field(f,f[0]=='nama'?$('#in_nama').value.toUpperCase():f[0]=='tahun_lulus'?$('#in_thn').value:'')).join('')
    +'<div class="full"><button id="sb">Lanjut ke pembayaran</button></div>';
  show('v2');scrollTo(0,0)};
let DATA=null;
$('#f2').onsubmit=e=>{e.preventDefault();DATA=collect(e.target);
  $('#qr').src=C.QR;$('#nom').textContent=C.NOMINAL;$('#pen').textContent=C.PENERIMA;show('v3');scrollTo(0,0)};
const shrink=f=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const s=Math.min(1,1100/Math.max(i.width,i.height)),c=document.createElement('canvas');
  c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.7))};i.onerror=no;i.src=URL.createObjectURL(f)});
$('#bk').onchange=e=>{const f=e.target.files[0];if(f){$('#pv').src=URL.createObjectURL(f);$('#pv').hidden=false}};
$('#paid').onclick=async()=>{const f=$('#bk').files[0];if(!f)return alert('Pilih screenshot bukti transfer dulu.');
  const b=$('#paid');b.disabled=true;b.textContent='Mengirim…';
  try{const r=await api({a:'submit',data:DATA,bukti:await shrink(f)});if(!r.ok)throw 0;$('#kode2').textContent=r.id;show('v4');scrollTo(0,0)}
  catch{alert('Gagal mengirim. Periksa koneksi lalu coba lagi.');b.disabled=false;b.textContent='Unggah bukti dan kirim pendaftaran'}};

/* ===== Admin (buka dengan #admin) ===== */
let PW='',R=[];
const COLS=[['id','Kode'],['status','Status'],['bukti','Bukti'],['nama','Nama'],['nik','NIK'],['jk','JK'],['tgl_lahir','Tgl lahir'],['jurusan','Jurusan'],['tahun_lulus','Lulus'],['nama_sekolah','Sekolah'],['hp','HP']];
const ST=['MENUNGGU VERIFIKASI','LUNAS','DITOLAK'];
function route(){const a=location.hash=='#admin';$('#adm').hidden=!a;$('#app').hidden=a}
addEventListener('hashchange',route);route();
const chips=k=>{const m={};R.forEach(r=>{const v=r[k]||'-';m[v]=(m[v]||0)+1});
  return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([v,n])=>`<span>${esc(v)}: <b>${n}</b></span>`).join('')||'<span class="mut">Belum ada data</span>'};
async function load(){const r=await api({a:'list',pw:PW});if(!r.ok){alert('Password salah');return false}R=r.rows;draw();return true}
function draw(){
  $('#stats').innerHTML=`<div class="card stat"><b>${R.length}</b>Total pelamar</div>`+ST.map(s=>`<div class="card stat"><b>${R.filter(r=>r.status==s).length}</b>${s}</div>`).join('');
  $('#rTh').innerHTML=chips('tahun_lulus');$('#rJr').innerHTML=chips('jurusan');
  $('#th').innerHTML='<tr>'+COLS.map(c=>`<th>${c[1]}</th>`).join('')+'<th>Aksi</th></tr>';
  const q=$('#q').value.toLowerCase();
  $('#tb').innerHTML=R.filter(r=>!q||Object.values(r).join(' ').toLowerCase().includes(q)).map(r=>'<tr>'+COLS.map(([k])=>
    k=='bukti'?`<td>${r.bukti?`<a href="${esc(r.bukti)}" target="_blank" rel="noopener">Lihat</a>`:'-'}</td>`:k=='status'?`<td><select data-st="${r.id}">${ST.map(s=>`<option${s==r.status?' selected':''}>${s}</option>`).join('')}</select></td>`:`<td>${esc(r[k])}</td>`).join('')
    +`<td><button class="s g" data-ed="${r.id}">Edit</button> <button class="s" data-del="${r.id}">Hapus</button></td></tr>`).join('')
    ||`<tr><td colspan="${COLS.length+1}" class="mut">Belum ada pelamar.</td></tr>`}
$('#login').onsubmit=async e=>{e.preventDefault();PW=$('#pw').value;if(await load()){$('#login').hidden=true;$('#dash').hidden=false}};
$('#q').oninput=draw;$('#rf').onclick=load;
$('#rs').onclick=async()=>{if(prompt('Ketik RESET untuk menghapus SEMUA data pelamar. Tindakan ini tidak bisa dibatalkan.')=='RESET'){await api({a:'reset',pw:PW});load()}};
$('#tb').onchange=async e=>{const id=e.target.dataset.st;if(id){await api({a:'update',pw:PW,id,data:{status:e.target.value}});load()}};
$('#tb').onclick=async e=>{const t=e.target;
  if(t.dataset.del){const r=R.find(x=>x.id==t.dataset.del);if(confirm('Hapus data '+r.nama+'?')){await api({a:'delete',pw:PW,id:r.id});load()}}
  if(t.dataset.ed){const r=R.find(x=>x.id==t.dataset.ed);$('#fe').dataset.id=r.id;
    $('#fe').innerHTML=FD.map(f=>field(f,r[f[0]])).join('')+'<div class="full bar"><button>Simpan perubahan</button><button type="button" class="g" id="cx">Batal</button></div>';
    $('#cx').onclick=()=>$('#dlg').close();$('#dlg').showModal()}};
$('#fe').onsubmit=async e=>{e.preventDefault();await api({a:'update',pw:PW,id:e.target.dataset.id,data:collect(e.target)});$('#dlg').close();load()};

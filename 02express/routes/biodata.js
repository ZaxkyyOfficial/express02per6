var express = require("express");
var router = express.Router();
const connection = require("../config/database");

// --- IMPORT MODULE UNTUK UPLOAD FILE ---
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// --- KONFIGURASI MULTER ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Tempat menyimpan foto
        cb(null, 'public/images/uploads/') 
    },
    filename: function (req, file, cb) {
        // Penamaan file agar unik (menghindari nama file yang sama)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });


// READ: Menampilkan semua data biodata
router.get("/", function (req, res, next) {
    connection.query("SELECT * FROM biodata ORDER BY id_biodata DESC", function (err, results) {
        if (err) {
            req.flash("error", "Gagal mengambil data dari database");
            res.render("biodata/index", { biodata: [] });
        } else {
            res.render("biodata/index", { biodata: results });
        }
    });
});

// CREATE: Menampilkan form tambah
router.get("/create", function (req, res, next) {
    res.render("biodata/create");
});

// STORE: Memproses data baru (termasuk upload foto)
// Tambahkan upload.single('foto_profil') sebagai middleware
router.post("/store", upload.single('foto_profil'), function (req, res, next) {
    try {
        let { nama, jenis_kelamin, alamat } = req.body;
        // Ambil nama file jika ada yang diupload
        let foto_profil = req.file ? req.file.filename : null;

        let Data = { nama, jenis_kelamin, alamat, foto_profil };

        connection.query('INSERT INTO biodata SET ?', Data, function(err, result) {
            if(err){
                req.flash('error', 'Gagal menyimpan data!');
            }else{
                req.flash('success', 'Berhasil menyimpan data biodata!');
            }
            res.redirect('/biodata');
        });
    } catch {
        req.flash('error', 'Terjadi kesalahan pada fungsi store');
        res.redirect('/biodata');
    }
});

// EDIT: Menampilkan form ubah data
router.get("/edit/:id", function (req, res, next) {
    let id = req.params.id;
    connection.query('SELECT * FROM biodata WHERE id_biodata = ?', [id], function(err, rows) {
        if(err || rows.length <= 0){
            req.flash('error', 'Data Biodata tidak ditemukan');
            res.redirect('/biodata');
        } else {
            // Render halaman edit dan kirim data lama ke view
            res.render("biodata/edit", {
                id_biodata: rows[0].id_biodata,
                nama: rows[0].nama,
                jenis_kelamin: rows[0].jenis_kelamin,
                alamat: rows[0].alamat,
                foto_profil: rows[0].foto_profil
            });
        }
    });
});

// UPDATE: Memproses perubahan data
// Gunakan upload.single untuk menangkap jika user mengganti foto
router.post("/update/:id", upload.single('foto_profil'), function (req, res, next) {
    let id = req.params.id;
    let { nama, jenis_kelamin, alamat } = req.body;
    let Data = { nama, jenis_kelamin, alamat };

    // Logika jika user MENGUNGGAH foto baru
    if (req.file) {
        Data.foto_profil = req.file.filename; // Masukkan nama file baru ke object update

        // Ambil nama file foto lama untuk dihapus dari folder
        connection.query('SELECT foto_profil FROM biodata WHERE id_biodata = ?', [id], function(err, rows) {
            if(!err && rows.length > 0 && rows[0].foto_profil) {
                let oldFile = path.join(__dirname, '../public/images/uploads/', rows[0].foto_profil);
                if(fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile); // Menghapus file lama
                }
            }
        });
    }

    // Eksekusi update ke database
    connection.query('UPDATE biodata SET ? WHERE id_biodata = ?', [Data, id], function(err, result) {
        if(err){
            req.flash('error', 'Gagal mengupdate data!');
        } else {
            req.flash('success', 'Berhasil mengupdate data biodata!');
        }
        res.redirect('/biodata');
    });
});

// DELETE: Menghapus data dan foto fisiknya
router.get("/delete/:id", function (req, res, next) {
    let id = req.params.id;

    // Ambil nama file foto terlebih dahulu untuk dihapus
    connection.query('SELECT foto_profil FROM biodata WHERE id_biodata = ?', [id], function(err, rows) {
        if(!err && rows.length > 0 && rows[0].foto_profil) {
            let oldFile = path.join(__dirname, '../public/images/uploads/', rows[0].foto_profil);
            if(fs.existsSync(oldFile)) {
                fs.unlinkSync(oldFile); // Menghapus file foto
            }
        }

        // Setelah foto terhapus, hapus datanya dari database
        connection.query('DELETE FROM biodata WHERE id_biodata = ?', [id], function(err, result) {
            if(err){
                req.flash('error', 'Gagal menghapus data!');
            } else {
                req.flash('success', 'Berhasil menghapus data biodata beserta fotonya!');
            }
            res.redirect('/biodata');
        });
    });
});

module.exports = router;
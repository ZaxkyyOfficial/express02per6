var express = require("express");
const connection = require("../config/database");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // Eksekusi query ke database
  connection.query(
    "SELECT * FROM kategori ORDER BY id_kategori ASC",
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.status(500).send("Terjadi kesalahan pada database");
      } else {
        let formattedData = results.map(function (row) {
          return {
            no: row.id_kategori,
            nama: row.nama_kategori,
            deskripsi: row.deskripsi,
          };
        });

        // Pagination logic
        const perPage = 10;
        const currentPage = parseInt(req.query.page) || 1;
        const totalPages = Math.ceil(formattedData.length / perPage);
        const startIndex = (currentPage - 1) * perPage;
        const paginatedData = formattedData.slice(
          startIndex,
          startIndex + perPage,
        );

        // Render ke EJS dan kirim data
        res.render("kategori", {
          title: "Kategori",
          kategori: paginatedData,
          allKategori: formattedData,
          currentPage: currentPage,
          totalPages: totalPages,
          totalData: formattedData.length,
        });
      }
    },
  );
});

// Langkah 1 - Membuat Router CREATE
router.get("/create", function (req, res, next) {
  res.render("kategori/create", {
    nama_kategori: "",
    deskripsi: "", // Tambahan untuk merender variabel deskripsi
  });
});

// Langkah 2 - Membuat Router STORE
router.post("/store", function (req, res, next) {
  try {
    // Menangkap nama_kategori DAN deskripsi dari form html
    let { nama_kategori, deskripsi } = req.body;

    let Data = {
      nama_kategori,
      deskripsi, // Memasukkan deskripsi ke dalam objek untuk disimpan
    };

    connection.query(
      "insert into kategori set ?",
      Data,
      function (err, result) {
        if (err) {
          req.flash("error", "Gagal menyimpan data!");
        } else {
          req.flash("success", "Berhasil menyimpan data!");
        }
        res.redirect("/kategori");
      },
    );
  } catch {
    req.flash("error", "Terjadi kesalahan pada fungsi");
    res.redirect("/kategori");
  }
});

// EDIT: Menampilkan form ubah data kategori
router.get("/edit/:no", function (req, res, next) {
  let no = req.params.no;
  connection.query(
    "SELECT * FROM kategori WHERE id_kategori = ?",
    [no],
    function (err, rows) {
      if (err || rows.length <= 0) {
        req.flash("error", "Data Kategori tidak ditemukan");
        res.redirect("/kategori");
      } else {
        res.render("kategori/edit", {
          id_kategori: rows[0].id_kategori,
          nama_kategori: rows[0].nama_kategori,
          deskripsi: rows[0].deskripsi,
        });
      }
    },
  );
});

// UPDATE: Memproses perubahan data kategori
router.post("/update/:no", function (req, res, next) {
  try {
    let id = req.params.no;
    let { nama_kategori, deskripsi } = req.body;

    let Data = {
      nama_kategori,
      deskripsi,
    };

    connection.query(
      "UPDATE kategori SET ? WHERE id_kategori = ?",
      [Data, id],
      function (err, result) {
        if (err) {
          req.flash("error", "Gagal mengupdate data!");
        } else {
          req.flash("success", "Berhasil mengupdate data kategori!");
        }
        res.redirect("/kategori");
      },
    );
  } catch {
    req.flash("error", "Terjadi kesalahan pada fungsi update");
    res.redirect("/kategori");
  }
});

// DELETE: Menampilkan halaman konfirmasi hapus
router.get("/delete/:no", function (req, res, next) {
  let no = req.params.no;
  connection.query(
    "SELECT * FROM kategori WHERE id_kategori = ?",
    [no],
    function (err, rows) {
      if (err || rows.length <= 0) {
        req.flash("error", "Data Kategori tidak ditemukan");
        res.redirect("/kategori");
      } else {
        res.render("kategori/delete", {
          id_kategori: rows[0].id_kategori,
          nama_kategori: rows[0].nama_kategori,
          deskripsi: rows[0].deskripsi,
        });
      }
    },
  );
});

// DESTROY: Menghapus data kategori dari database
router.post("/destroy/:no", function (req, res, next) {
  try {
    let id = req.params.no;

    connection.query(
      "DELETE FROM kategori WHERE id_kategori = ?",
      [id],
      function (err, result) {
        if (err) {
          req.flash("error", "Gagal menghapus data!");
        } else {
          req.flash("success", "Berhasil menghapus data kategori!");
        }
        res.redirect("/kategori");
      },
    );
  } catch {
    req.flash("error", "Terjadi kesalahan pada fungsi destroy");
    res.redirect("/kategori");
  }
});

module.exports = router;

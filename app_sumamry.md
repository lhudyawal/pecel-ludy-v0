Tentu, mari kita bedah lebih dalam. Untuk aplikasi **Sambel Pecel Ludy**, alur kerja harus dirancang seefisien mungkin agar *sales* tidak terbebani administrasi yang rumit di lapangan, namun tetap memberikan data yang akurat bagi *supervisor*.

Berikut adalah detail **Core Features** dan **App Flow** yang sistematis:

---

## I. Core Features (Fitur Utama)

### 1. Manajemen Profil & Tim (Admin & Supervisor)
* **User Mapping:** Admin menentukan hierarki (siapa Supervisor yang membawahi Sales A, B, dan C).
* **Config Gaji & Target:** Input Gaji Pokok (misal: Rp2.200.000) dan Target Bulanan (misal: Rp10.000.000).
* **Master Produk:** Pengaturan daftar produk sambel pecel (ukuran, harga, stok).

### 2. CRM Toko (Sales)
* **Detail Address Form:** Input data toko dengan format lengkap:
    * Identitas: Nama Toko, Nama Pemilik.
    * Lokasi: Nama Jalan, No, RT/RW, Desa/Kelurahan, Kecamatan, Kab/Kota, Provinsi.
* **Shop Log:** Riwayat kunjungan dan transaksi per toko agar sales bisa melihat kebiasaan order tiap pelanggan.
* **Visit Planner:** Fitur untuk memilih toko yang akan dikunjungi besok dan tombol **"Cetak Rencana Kunjungan"** (PDF/Print) untuk panduan fisik.

### 3. Sales Tracking & Transaction (Sales)
* **Input Transaksi:** Form input jumlah produk yang terjual per kunjungan.
* **Daily Report (Attendance):** Tombol "Kirim Laporan Harian" di akhir jam kerja. 
    * *Logic:* Jika tombol ini tidak ditekan atau tidak ada transaksi, sistem otomatis menandai "Alpa/Tidak Masuk".

### 4. Engine Gaji & Penalti (Automated Logic)
Sistem menghitung otomatis di dashboard Sales:
* **Real-time Progress:** Menampilkan total rupiah yang sudah dicapai vs target.
* **Penalty Warning:** Simulasi potongan gaji berjalan. 
    * *Formula:* $Potongan = (Target - Realisasi) \times 10\%$.

### 5. Verification & Performance Dashboard (Supervisor)
* **Verification Queue:** Daftar laporan harian sales yang masuk untuk disetujui.
* **Performance Analytics:** Grafik pencapaian tim dan status kehadiran harian.

---

## II. App Flow (Alur Aplikasi)

### **A. Alur Setup (Awal Bulan)**
1.  **Admin** membuat akun untuk Supervisor dan Sales.
2.  **Supervisor** masuk ke menu "Manajemen Tim", lalu menginput target bulanan dan gaji pokok untuk setiap sales di bawahnya.
3.  **Sales** menerima notifikasi target bulan berjalan di dashboard mereka.

### **B. Alur Kerja Harian (Operasional)**
1.  **Pagi:** Sales membuka aplikasi, melihat "Rencana Kunjungan", dan mencetak daftar toko jika diperlukan.
2.  **Di Lapangan (Input Toko):** Jika menemukan toko baru, Sales mengisi form alamat lengkap (RT/RW hingga Provinsi).
3.  **Di Lapangan (Transaksi):** * Sales masuk ke menu toko.
    * Menginput barang yang terjual.
    * Sistem mencatat transaksi tersebut ke dalam "Log Toko" dan menambah angka "Realisasi Target" Sales.
4.  **Sore (Reporting):** Sales melakukan "Submit Laporan Harian".

### **C. Alur Verifikasi & Penggajian (Monitoring)**
1.  **Supervisor** menerima notifikasi laporan masuk.
2.  Supervisor memeriksa apakah transaksi wajar. Jika OK, tekan **"Verifikasi"**. 
    * *Impact:* Status kehadiran Sales menjadi "Hadir".
3.  **Sistem** secara otomatis mengupdate dashboard gaji. Sales bisa melihat:
    * "Capaian: Rp9.000.000"
    * "Potongan: Rp100.000"
    * "Estimasi Gaji: Rp2.100.000"

---

## III. Skema Database (Ringkasan)

| Tabel | Kolom Utama |
| :--- | :--- |
| **Users** | id, name, role (admin/spv/sales), supervisor_id, base_salary, monthly_target |
| **Toko** | id, sales_id, nama_toko, pemilik, jalan, no, rt, rw, desa, kecamatan, kota, provinsi |
| **Transaksi** | id, toko_id, sales_id, total_harga, created_at, is_verified (boolean) |
| **Kunjungan** | id, toko_id, sales_id, catatan, created_at |
| **Laporan_Harian** | id, sales_id, tanggal, status_hadir, supervisor_notes |

---

### Tips Implementasi:
Mengingat Anda memiliki kebutuhan untuk mencetak data, pastikan fitur **"Cetak Rencana Kunjungan"** mendukung format yang ramah printer thermal atau PDF standar agar mudah dibawa oleh sales saat motoran.

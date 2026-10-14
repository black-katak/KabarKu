-- Naikkan batas lagu ke 20 MB dan perluas jenis audio yang diterima.
-- Jalankan di SQL Editor Supabase. Aman dijalankan ulang.
update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp',
      'audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac',
      'audio/ogg','audio/opus','audio/wav','audio/x-wav','audio/wave','audio/webm'
    ]
where id = 'boards-media';

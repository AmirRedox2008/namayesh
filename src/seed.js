const normalize = require('./normalize')

module.exports = function seed(db) {
  const addPlan = db.prepare('INSERT INTO plans (code, name, price, days) VALUES (?, ?, ?, ?)')
  addPlan.run('free', 'رایگان', 0, 36500)
  addPlan.run('vip', 'ویژه', 149000, 30)

  const addTitle = db.prepare(
    'INSERT INTO titles (type, title, search_title, description, year, genres, rating, vip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const addEpisode = db.prepare(
    'INSERT INTO episodes (title_id, season, number, title, duration, vip, file) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  const movies = [
    ['جدایی نادر از سیمین', 'نادر و سیمین برای آینده زندگی مشترکشان در یک دوراهی سخت قرار می‌گیرند و همین تصمیم، زندگی چند خانواده را برای همیشه تغییر می‌دهد.', 2011, 'درام,خانوادگی', 8.3, 0],
    ['فروشنده', 'امد و رعنا برای شروعی تازه به خانه‌ای جدید نقل مکان می‌کنند، اما اتفاقی در همان روزهای اول، آرامش زندگی‌شان را به هم می‌ریزد.', 2016, 'درام', 7.8, 0],
    ['درباره الی', 'گروهی از دوستان قدیمی به سفری شمال می‌روند و غیبت ناگهانی الی، سفر را به آزمونی سخت برای همه تبدیل می‌کند.', 2009, 'درام', 7.9, 0],
    ['قیصر', 'قیصر پس از مرگ برادرش تصمیم می‌گیرد به تنهایی از کسانی که حق خانواده‌اش را خوردند انتقام بگیرد.', 1969, 'درام,جنایی', 8.1, 0],
    ['گوزن‌ها', 'دو دوست قدیمی در روزهای پرآشوب سال ۱۳۵۷ تهران، هر کدام راه خودشان را برای ادامه زندگی انتخاب می‌کنند.', 1974, 'درام', 8.0, 0],
    ['چ', 'سه روز از حضور مصطفی چمران در پاوه و مقاومت نیروهایش تا آخرین شب زندگی او روایت می‌شود.', 2014, 'درام,تاریخی', 7.4, 0],
    ['اژدها وارد می‌شود!', 'رضا تازه به تلمبه‌خانه پدربزرگش رسیده که اتفاقی عجیب، زندگی آرام محل را زیر و رو می‌کند.', 2016, 'کمدی,فانتزی', 6.6, 1],
    ['هزارپا', 'یک خانواده شلوغ برای به دست آوردن ارث پدربزرگ، وارد ماجراجویی عجیبی می‌شوند.', 2018, 'کمدی,خانوادگی', 5.9, 1],
  ]

  for (const [title, description, year, genres, rating, vip] of movies) {
    addTitle.run('movie', title, normalize(title), description, year, genres, rating, vip)
  }

  const series = [
    {
      title: 'پایتخت',
      description: 'ماجراهای طنزآمیز دو برادر، نقی و ارسطو، و خانواده‌هایشان در تهران.',
      year: 2011,
      genres: 'کمدی,خانوادگی',
      rating: 8.2,
      vip: 0,
      episodes: 4,
      duration: 2500,
    },
    {
      title: 'زخم کاری',
      description: 'روایت قدرت، خانواده و انتقام؛ جایی که هیچ رنجشی برای همیشه فراموش نمی‌شود.',
      year: 2021,
      genres: 'درام,جنایی',
      rating: 7.5,
      vip: 1,
      episodes: 4,
      duration: 2700,
    },
    {
      title: 'یاغی',
      description: 'مردی که برای حفظ خانواده‌اش مجبور می‌شود با گذشته‌اش رو در رو شود.',
      year: 2017,
      genres: 'اکشن,درام',
      rating: 6.7,
      vip: 0,
      episodes: 4,
      duration: 2600,
    },
    {
      title: 'مانکن',
      description: 'دختری برای پیشرفت در کارش وارد قراردادی عجیب می‌شود و ماجراهای طنز از همین‌جا شروع می‌شود.',
      year: 2017,
      genres: 'کمدی,عاشقانه',
      rating: 5.9,
      vip: 0,
      episodes: 4,
      duration: 2400,
    },
  ]

  const numbers = ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸']
  for (const show of series) {
    const info = addTitle.run('series', show.title, normalize(show.title), show.description, show.year, show.genres, show.rating, show.vip)
    for (let i = 1; i <= show.episodes; i++) {
      addEpisode.run(info.lastInsertRowid, 1, i, 'قسمت ' + numbers[i - 1], show.duration, show.vip, 'sample.mp4')
    }
  }
}

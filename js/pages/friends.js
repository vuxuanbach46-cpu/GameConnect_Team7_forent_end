// Kiểm tra đăng nhập: Người dùng chưa đăng nhập -> chuyển về file index
if (!localStorage.getItem("access_token")) {
  window.location.href = "../index.html";
}

// =========================================================================
// Trang Bạn Bè & Kết Nối (UI/UX Mock Data — Chưa cần kết nối Backend)
// 4 Tab tương ứng với hình mẫu:
//   1. BẠN BÈ (Ô màu đỏ)
//   2. LỜI MỜI ĐẾN (Ô màu tím)
//   3. ĐÃ GỬI (Ô màu hồng)
//   4. GỢI Ý BẠN CHUNG (Ô màu xanh)
// Quy tắc hiển thị:
//   - Cột Tên Game:
//       + Nếu chơi CS2: Hiện huy hiệu từ folder ranks/ (1.png..40.png của repo itzarty/csgo-rank-icons)
//       + Các game còn lại (Valorant, LMHT, Liên Quân): Hiện huy hiệu Cấp độ (AP / Cấp)
//   - Cột Mức Rank:
//       + Người chơi CS2 chỉ chọn 1 trong 2: HOẶC FACEIT (folder faceit/*.svg) HOẶC Premier (khung điểm tự đổi màu theo số)
// =========================================================================

const MOCK_DATA = {
  // 1. TAB BẠN BÈ (Ô MÀU ĐỎ) — 18 NGƯỜI CHƠI ĐỂ TEST PHÂN TRANG (3 TRANG x 6 NGƯỜI)
  friends: [
    {
      id: 101,
      name: "Hoàng Minh (ZeroCool)",
      tag: "#VN01",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=ZeroCool&backgroundColor=ffdfbf",
      presence: "ingame",
      statusText: "ĐANG TRONG TRẬN · XẾP HẠNG 5V5 (11 - 8)",
      subInfo: "Hay chơi: 20:00 - 23:00",
      game: "Valorant",
      gameLevel: 248,
      roles: ["Duelist", "Jett / Reyna"],
      rankName: "Radiant",
      rankIcon: "../assets/images/ranks/valorant/Radiant_Rank.png",
      elo: "850 RR · Top #112 SEA"
    },
    {
      id: 102,
      name: "Trần Đức Huy (HuySniper)",
      tag: "#CS2VN",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HuySniper&backgroundColor=c0aede",
      presence: "ingame",
      statusText: "ĐANG TRONG PHÒNG CHỜ · TÌM ĐỘI (4/5)",
      inRoom: true,
      roomPost: "Phòng CS2 · Cần thêm 1 Support (4/5)",
      game: "CS2",
      cs2RankLevel: 40,
      roles: ["AWPer", "Entry"],
      cs2Mode: "faceit",
      rankName: "Challenger",
      rankIcon: "../assets/images/ranks/faceit/11.svg",
      elo: "Top 1,000 · 2,480 ELO"
    },
    {
      id: 103,
      name: "Đỗ Hải Nam (NamFlorentino)",
      tag: "#AOVTOP1",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=NamFlo&backgroundColor=c0aede",
      presence: "ingame",
      statusText: "ĐANG ĐẤU ĐỈNH CAO · PHÚT 14",
      subInfo: "16 bạn chung · Top 1 Florentino miền Bắc",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Solo Tà Thần", "Đi Rừng"],
      rankName: "Thách Đấu (Challenger)",
      rankIcon: "../assets/images/ranks/aov/challenger.png",
      elo: "128 Sao · Top #18 Máy chủ"
    },
    {
      id: 104,
      name: "Vũ Hoàng Phúc (PhucConqueror)",
      tag: "#CT50SAO",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=PhucAOV&backgroundColor=ffdfbf",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · TÌM TEAM 5 NGƯỜI",
      subInfo: "11 bạn chung · Hay chơi: 19:00 - 22:00",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Xạ Thủ", "Đường Giữa"],
      rankName: "Chiến Tướng (Conqueror)",
      rankIcon: "../assets/images/ranks/aov/conqueror.png",
      elo: "74 Sao · Đấu Đỉnh Cao 2,150đ"
    },
    {
      id: 105,
      name: "Lê Khánh Linh (LinhBae)",
      tag: "#LOL99",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=LinhBae&backgroundColor=ffd5dc",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · SẴN SÀNG GHÉP ĐỘI",
      subInfo: "12 bạn chung · Hay chơi buổi tối",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 386,
      roles: ["Support", "Mid"],
      rankName: "Cao Thủ (Master)",
      rankIcon: "../assets/images/ranks/lol/8.png",
      elo: "420 LP · Đơn/Đôi"
    },
    {
      id: 106,
      name: "Phạm Quốc Bảo (BaoClutch)",
      tag: "#CS2PRO",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=BaoPUBG&backgroundColor=d1d4f9",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · SẢNH PREMIER",
      inRoom: true,
      roomPost: "Phòng CS2 Premier · Cần thêm 2 người · Rank 15,000+",
      game: "CS2",
      cs2RankLevel: 36,
      roles: ["IGL", "Rifler"],
      cs2Mode: "premier",
      premierScore: 26450,
      rankName: "CS2 Premier",
      elo: "Mốc Đỏ (25,000 - 29,999)"
    },
    {
      id: 107,
      name: "Nguyễn Tuấn Anh (TuanJungle)",
      tag: "#JGKING",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=TuanJungle&backgroundColor=b6e3f4",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · TRONG SẢNH",
      inRoom: true,
      roomPost: "Phòng Xếp hạng Đơn/Đôi · Cần 1 Hỗ Trợ · Kim Cương+",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 615,
      roles: ["Jungle", "Top"],
      rankName: "Thách Đấu (Challenger)",
      rankIcon: "../assets/images/ranks/lol/10.png",
      elo: "980 LP · Top #45 VN"
    },
    {
      id: 108,
      name: "Trương Mỹ Duyên (DuyenAlice)",
      tag: "#SPPRO",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=DuyenAlice&backgroundColor=ffd5dc",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · SẴN SÀNG LEO RANK",
      subInfo: "9 bạn chung · Chuyên Trợ Thủ bảo kê Xạ Thủ",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Trợ Thủ", "Đường Giữa"],
      rankName: "Cao Thủ (Master)",
      rankIcon: "../assets/images/ranks/aov/master.png",
      elo: "36 Sao · Tỷ lệ thắng 62%"
    },
    {
      id: 109,
      name: "Đặng Minh Quân (QuanViper)",
      tag: "#SMOKE",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=QuanViper&backgroundColor=b6e3f4",
      presence: "ingame",
      statusText: "ĐANG TRONG TRẬN · LOTUS (8 - 5)",
      subInfo: "Hay chơi: 20:30 - 23:30",
      game: "Valorant",
      gameLevel: 182,
      roles: ["Controller", "Viper / Omen"],
      rankName: "Ascendant 2",
      rankIcon: "../assets/images/ranks/valorant/Ascendant_2_Rank.png",
      elo: "64 RR · Ascendant"
    },
    {
      id: 110,
      name: "Lê Văn Kiên (KienFaceit10)",
      tag: "#LVL10",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KienFaceit&backgroundColor=ffdfbf",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · TÌM KÈO 5V5",
      subInfo: "19 bạn chung · Đội trưởng CLB Hà Nội",
      game: "CS2",
      cs2RankLevel: 38,
      roles: ["Entry Fragger", "Rifler"],
      cs2Mode: "faceit",
      rankName: "FACEIT Level 10",
      rankIcon: "../assets/images/ranks/faceit/10.svg",
      elo: "2,190 ELO · K/R 0.88"
    },
    {
      id: 111,
      name: "Ngô Bảo Châu (ChauLiliana)",
      tag: "#MAGE99",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=ChauLiliana&backgroundColor=c0aede",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · RẢNH ĐẾN 23H",
      subInfo: "7 bạn chung · Pháp sư đường giữa",
      game: "Liên Quân Mobile",
      gameLevel: 29,
      roles: ["Đường Giữa", "Trợ Thủ"],
      rankName: "Tinh Anh I (Veteran)",
      rankIcon: "../assets/images/ranks/aov/veteran.png",
      elo: "Tinh Anh I · 4 Sao"
    },
    {
      id: 112,
      name: "Phan Hoàng Khang (KhangYasuo)",
      tag: "#HASAGI",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KhangYasuo&backgroundColor=d1d4f9",
      presence: "offline",
      statusText: "HOẠT ĐỘNG 35 PHÚT TRƯỚC",
      subInfo: "10 bạn chung · Thông thạo 7 Yasuo / Yone",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 295,
      roles: ["Mid", "Top"],
      rankName: "Kim Cương (Diamond)",
      rankIcon: "../assets/images/ranks/lol/7.png",
      elo: "75 LP · Đơn/Đôi"
    },
    {
      id: 113,
      name: "Bùi Tiến Đạt (DatHayate)",
      tag: "#SHURIKEN",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=DatHayate&backgroundColor=b6e3f4",
      presence: "offline",
      statusText: "HOẠT ĐỘNG 1 GIỜ TRƯỚC",
      subInfo: "5 bạn chung · Chuyên Xạ Thủ đường Rồng",
      game: "Liên Quân Mobile",
      gameLevel: 28,
      roles: ["Xạ Thủ", "Solo Tà Thần"],
      rankName: "Kim Cương II (Diamond)",
      rankIcon: "../assets/images/ranks/aov/diamond.png",
      elo: "Kim Cương II · 5 Sao"
    },
    {
      id: 114,
      name: "Trần Thanh Sơn (SonPremier)",
      tag: "#AWPKING",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=SonPremier&backgroundColor=ffdfbf",
      presence: "offline",
      statusText: "HOẠT ĐỘNG 2 GIỜ TRƯỚC",
      subInfo: "8 bạn chung · Chuyên Dust2 & Ancient",
      game: "CS2",
      cs2RankLevel: 27,
      roles: ["AWPer", "Support"],
      cs2Mode: "premier",
      premierScore: 18420,
      rankName: "CS2 Premier",
      elo: "Mốc Tím (15,000 - 19,999)"
    },
    {
      id: 115,
      name: "Lâm Gia Hân (HanKilljoy)",
      tag: "#TURRET",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HanKilljoy&backgroundColor=ffd5dc",
      presence: "offline",
      statusText: "HOẠT ĐỘNG 3 GIỜ TRƯỚC",
      subInfo: "6 bạn chung · Hay chơi cuối tuần",
      game: "Valorant",
      gameLevel: 134,
      roles: ["Sentinel", "Killjoy / Sage"],
      rankName: "Diamond 3",
      rankIcon: "../assets/images/ranks/valorant/Diamond_3_Rank.png",
      elo: "81 RR · Diamond"
    },
    {
      id: 116,
      name: "Đoàn Văn Hậu (HauTanker)",
      tag: "#THANE",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HauTanker&backgroundColor=c0aede",
      presence: "offline",
      statusText: "HOẠT ĐỘNG 5 GIỜ TRƯỚC",
      subInfo: "4 bạn chung · Đỡ đòn mở giao tranh",
      game: "Liên Quân Mobile",
      gameLevel: 26,
      roles: ["Đỡ Đòn", "Trợ Thủ"],
      rankName: "Bạch Kim I (Platinum)",
      rankIcon: "../assets/images/ranks/aov/platinum.png",
      elo: "Bạch Kim I · 3 Sao"
    },
    {
      id: 117,
      name: "Vương Quốc Tuấn (TuanLeeSin)",
      tag: "#INSEC",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=TuanLeeSin&backgroundColor=d1d4f9",
      presence: "offline",
      statusText: "HOẠT ĐỘNG HÔM QUA",
      subInfo: "5 bạn chung · Đi rừng gank sớm",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 210,
      roles: ["Jungle", "Mid"],
      rankName: "Lục Bảo (Emerald)",
      rankIcon: "../assets/images/ranks/lol/6.png",
      elo: "52 LP · Linh Hoạt"
    },
    {
      id: 118,
      name: "Nguyễn Minh Triết (TrietValhein)",
      tag: "#FULLAP",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=TrietValhein&backgroundColor=ffdfbf",
      presence: "offline",
      statusText: "HOẠT ĐỘNG 2 NGÀY TRƯỚC",
      subInfo: "3 bạn chung · Chơi giải trí vui vẻ",
      game: "Liên Quân Mobile",
      gameLevel: 22,
      roles: ["Xạ Thủ", "Đường Giữa"],
      rankName: "Vàng I (Gold)",
      rankIcon: "../assets/images/ranks/aov/gold.png",
      elo: "Vàng I · 4 Sao"
    },
    {
      id: 119,
      name: "Đặng Hoàng Phúc (PhucChessGod)",
      tag: "#TFTVN",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=PhucChess&backgroundColor=c0aede",
      presence: "ingame",
      statusText: "ĐANG TRONG TRẬN · VÒNG 5-2 (TOP 1 MÁU)",
      subInfo: "10 bạn chung · Chuyên Flex đội hình Exodia",
      game: "Đấu Trường Chân Lý",
      gameLevel: 310,
      roles: ["Flex Đỉnh Cao", "Cặp Đôi Hoàn Hảo"],
      rankName: "Thách Đấu (Challenger)",
      rankIcon: "../assets/images/ranks/lol/10.png",
      elo: "1,120 LP · Top #28 VN"
    },
    {
      id: 120,
      name: "Trần Bảo Ngọc (NgocReroll)",
      tag: "#3SAO",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=NgocReroll&backgroundColor=ffd5dc",
      presence: "online",
      statusText: "ĐANG TRỰC TUYẾN · TÌM BẠN CHƠI CẶP ĐÔI",
      subInfo: "7 bạn chung · Hay ghép Cặp Đôi Hoàn Hảo buổi tối",
      game: "Đấu Trường Chân Lý",
      gameLevel: 185,
      roles: ["Reroll", "Cặp Đôi Hoàn Hảo"],
      rankName: "Cao Thủ (Master)",
      rankIcon: "../assets/images/ranks/lol/8.png",
      elo: "340 LP · Tỷ lệ vào Top 4: 66%"
    }
  ],

  // 2. TAB LỜI MỜI ĐẾN (Ô MÀU TÍM) — 10 NGƯỜI CHƠI ĐỂ TEST PHÂN TRANG
  received: [
    {
      id: 201,
      name: "Vũ Minh Khôi (KhoiTapHead)",
      tag: "#TAP1",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KhoiTap&backgroundColor=ffdfbf",
      presence: "online",
      statusText: "GỬI LỜI MỜI 15 PHÚT TRƯỚC",
      subInfo: "9 bạn chung (ZeroCool, HuySniper...) · Hay chơi: 19:30 - 22:30",
      game: "Valorant",
      gameLevel: 194,
      roles: ["Initiator", "Sova / Fade"],
      rankName: "Immortal 3",
      rankIcon: "../assets/images/ranks/valorant/Immortal_3_Rank.png",
      elo: "410 RR · Immortal"
    },
    {
      id: 202,
      name: "Hoàng Gia Bảo (BaoConqueror)",
      tag: "#AOVPRO",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=BaoConqueror&backgroundColor=c0aede",
      presence: "ingame",
      statusText: "GỬI LỜI MỜI 30 PHÚT TRƯỚC",
      subInfo: "12 bạn chung · Top BXH Chiến Tướng mùa hiện tại",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Đi Rừng", "Nakroth / Keera"],
      rankName: "Chiến Tướng (Conqueror)",
      rankIcon: "../assets/images/ranks/aov/conqueror.png",
      elo: "68 Sao · Chiến Tướng"
    },
    {
      id: 203,
      name: "Bùi Thảo Vy (VyMage)",
      tag: "#MID",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=VyMage&backgroundColor=ffd5dc",
      presence: "ingame",
      statusText: "GỬI LỜI MỜI 2 GIỜ TRƯỚC",
      subInfo: "5 bạn chung · Tìm bạn leo rank Kim Cương - Cao Thủ",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 240,
      roles: ["Mid", "ADC"],
      rankName: "Kim Cương (Diamond)",
      rankIcon: "../assets/images/ranks/lol/7.png",
      elo: "86 LP · Winrate 59%"
    },
    {
      id: 204,
      name: "Đặng Quốc Khánh (KhanhClutch)",
      tag: "#CS2",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KhanhClutch&backgroundColor=b6e3f4",
      presence: "online",
      statusText: "GỬI LỜI MỜI 4 GIỜ TRƯỚC",
      subInfo: "14 bạn chung · Tuyển thành viên giải đấu cuối tuần",
      game: "CS2",
      cs2RankLevel: 28,
      roles: ["Rifler", "Lurker"],
      cs2Mode: "premier",
      premierScore: 21847,
      rankName: "CS2 Premier",
      elo: "Mốc Hồng (20,000 - 24,999)"
    },
    {
      id: 205,
      name: "Ngô Gia Huy (HuyAOV)",
      tag: "#BESTNAK",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HuyRunning&backgroundColor=d1d4f9",
      presence: "online",
      statusText: "GỬI LỜI MỜI HÔM QUA, 21:30 GMT+7",
      subInfo: "6 bạn chung · Hay onl 20:00 - 23:30",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Đi Rừng", "Trợ Thủ"],
      rankName: "Tinh Anh II (Veteran)",
      rankIcon: "../assets/images/ranks/aov/veteran.png",
      elo: "Tinh Anh II · 5 Sao"
    },
    {
      id: 206,
      name: "Trần Nhật Minh (MinhFaceit9)",
      tag: "#ONECLICK",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=MinhFaceit9&backgroundColor=ffdfbf",
      presence: "online",
      statusText: "GỬI LỜI MỜI HÔM QUA, 19:10 GMT+7",
      subInfo: "8 bạn chung · Tìm đồng đội bắn FACEIT tối nay",
      game: "CS2",
      cs2RankLevel: 33,
      roles: ["Entry", "Rifler"],
      cs2Mode: "faceit",
      rankName: "FACEIT Level 9",
      rankIcon: "../assets/images/ranks/faceit/9.svg",
      elo: "1,920 ELO · HS 58%"
    },
    {
      id: 207,
      name: "Lê Minh Châu (ChauJett)",
      tag: "#DASH",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=ChauJett&backgroundColor=ffd5dc",
      presence: "offline",
      statusText: "GỬI LỜI MỜI 2 NGÀY TRƯỚC",
      subInfo: "4 bạn chung · Chuyên Duelist mở site",
      game: "Valorant",
      gameLevel: 145,
      roles: ["Duelist", "Jett / Neon"],
      rankName: "Platinum 3",
      rankIcon: "../assets/images/ranks/valorant/Platinum_3_Rank.png",
      elo: "77 RR · Platinum"
    },
    {
      id: 208,
      name: "Phạm Văn Tùng (TungSilverAOV)",
      tag: "#NEWBIE",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=TungSilver&backgroundColor=b6e3f4",
      presence: "offline",
      statusText: "GỬI LỜI MỜI 2 NGÀY TRƯỚC",
      subInfo: "2 bạn chung · Người chơi mới cần tìm sư phụ chỉ giáo",
      game: "Liên Quân Mobile",
      gameLevel: 18,
      roles: ["Đỡ Đòn", "Xạ Thủ"],
      rankName: "Bạc I (Silver)",
      rankIcon: "../assets/images/ranks/aov/silver.png",
      elo: "Bạc I · 3 Sao"
    },
    {
      id: 209,
      name: "Đỗ Quang Vinh (VinhGrandmaster)",
      tag: "#GMVN",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=VinhGM&backgroundColor=c0aede",
      presence: "online",
      statusText: "GỬI LỜI MỜI 3 NGÀY TRƯỚC",
      subInfo: "11 bạn chung · Tuyển Mid/Jungle đánh giải Sinh Viên",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 490,
      roles: ["Support", "Thresh / Nautilus"],
      rankName: "Đại Cao Thủ (Grandmaster)",
      rankIcon: "../assets/images/ranks/lol/9.png",
      elo: "615 LP · Đơn/Đôi"
    },
    {
      id: 210,
      name: "Nguyễn Hữu Phước (PhuocBronze)",
      tag: "#FUNPLAY",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=PhuocBronze&backgroundColor=d1d4f9",
      presence: "offline",
      statusText: "GỬI LỜI MỜI 4 NGÀY TRƯỚC",
      subInfo: "1 bạn chung · Mới tạo tài khoản Liên Quân",
      game: "Liên Quân Mobile",
      gameLevel: 12,
      roles: ["Xạ Thủ", "Arthur / Valhein"],
      rankName: "Đồng I (Bronze)",
      rankIcon: "../assets/images/ranks/aov/bronze.png",
      elo: "Đồng I · 2 Sao"
    }
  ],

  // 3. TAB ĐÃ GỬI (Ô MÀU HỒNG) — 8 NGƯỜI CHƠI ĐỂ TEST PHÂN TRANG
  sent: [
    {
      id: 301,
      name: "Lý Hoàng Long (DragonADC)",
      tag: "#PENTAKILL",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=DragonADC&backgroundColor=c0aede",
      presence: "ingame",
      statusText: "ĐÃ GỬI HÔM NAY, 18:40 GMT+7 · ĐANG CHỜ PHẢN HỒI",
      subInfo: "7 bạn chung · Top 50 Xạ Thủ máy chủ Việt Nam",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 542,
      roles: ["ADC", "Kai'Sa / Ezreal"],
      rankName: "Đại Cao Thủ (Grandmaster)",
      rankIcon: "../assets/images/ranks/lol/9.png",
      elo: "720 LP"
    },
    {
      id: 302,
      name: "Trịnh Minh Nhật (NhatSmoke)",
      tag: "#OMEN",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=NhatSmoke&backgroundColor=b6e3f4",
      presence: "online",
      statusText: "ĐÃ GỬI HÔM QUA, 20:15 GMT+7 · ĐANG CHỜ PHẢN HỒI",
      subInfo: "4 bạn chung · Chuyên Controller kiểm soát bản đồ",
      game: "Valorant",
      gameLevel: 156,
      roles: ["Controller", "Omen / Viper"],
      rankName: "Ascendant 3",
      rankIcon: "../assets/images/ranks/valorant/Ascendant_3_Rank.png",
      elo: "92 RR · Ascendant"
    },
    {
      id: 303,
      name: "Phan Thanh Tùng (TungDeagle)",
      tag: "#HS100",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=TungDeagle&backgroundColor=ffdfbf",
      presence: "offline",
      statusText: "ĐÃ GỬI 2 NGÀY TRƯỚC · ĐANG CHỜ PHẢN HỒI",
      subInfo: "6 bạn chung · Hay chơi: 18:00 - 21:00",
      game: "CS2",
      cs2RankLevel: 24,
      roles: ["Entry Fragger", "Rifler"],
      cs2Mode: "faceit",
      rankName: "FACEIT Level 8",
      rankIcon: "../assets/images/ranks/faceit/8.svg",
      elo: "1,710 ELO"
    },
    {
      id: 304,
      name: "Kiều Tuấn Anh (TuanAnhThachDau)",
      tag: "#TOP1AOV",
      verified: true,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KieuTuanAnh&backgroundColor=ffd5dc",
      presence: "ingame",
      statusText: "ĐÃ GỬI 2 NGÀY TRƯỚC · ĐANG CHỜ PHẢN HỒI",
      subInfo: "15 bạn chung · Tuyển thủ bán chuyên Đấu Trường Danh Vọng",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Đi Rừng", "Aoi / Nakroth"],
      rankName: "Thách Đấu (Challenger)",
      rankIcon: "../assets/images/ranks/aov/challenger.png",
      elo: "145 Sao · Top #9 Máy chủ"
    },
    {
      id: 305,
      name: "Đinh Hoàng Hiệp (HiepBlueCS2)",
      tag: "#PREMIER12K",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HiepBlue&backgroundColor=d1d4f9",
      presence: "online",
      statusText: "ĐÃ GỬI 3 NGÀY TRƯỚC · ĐANG CHỜ PHẢN HỒI",
      subInfo: "5 bạn chung · Chuyên Nuke / Overpass",
      game: "CS2",
      cs2RankLevel: 21,
      roles: ["Support", "Rifler"],
      cs2Mode: "premier",
      premierScore: 12640,
      rankName: "CS2 Premier",
      elo: "Mốc Xanh Dương (10,000 - 14,999)"
    },
    {
      id: 306,
      name: "Cao Thái Sơn (SonMurad)",
      tag: "#AOANH",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=SonMurad&backgroundColor=c0aede",
      presence: "offline",
      statusText: "ĐÃ GỬI 4 NGÀY TRƯỚC · ĐANG CHỜ PHẢN HỒI",
      subInfo: "8 bạn chung · Chuyên Sát Thủ & Đấu Sĩ",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Đi Rừng", "Solo Tà Thần"],
      rankName: "Cao Thủ (Master)",
      rankIcon: "../assets/images/ranks/aov/master.png",
      elo: "41 Sao · Cao Thủ"
    },
    {
      id: 307,
      name: "Nguyễn Ngọc Ánh (AnhLux)",
      tag: "#DEMACIA",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=AnhLux&backgroundColor=ffd5dc",
      presence: "online",
      statusText: "ĐÃ GỬI 5 NGÀY TRƯỚC · ĐANG CHỜ PHẢN HỒI",
      subInfo: "3 bạn chung · Hay đánh ARAM & Xếp hạng Linh Hoạt",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 178,
      roles: ["Support", "Mid"],
      rankName: "Bạch Kim (Platinum)",
      rankIcon: "../assets/images/ranks/lol/5.png",
      elo: "68 LP · Bạch Kim II"
    },
    {
      id: 308,
      name: "Trần Quốc Đạt (DatChamber)",
      tag: "#TOURDEFORCE",
      verified: false,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=DatChamber&backgroundColor=ffdfbf",
      presence: "offline",
      statusText: "ĐÃ GỬI 1 TUẦN TRƯỚC · ĐANG CHỜ PHẢN HỒI",
      subInfo: "4 bạn chung · Chuyên Operator góc dài",
      game: "Valorant",
      gameLevel: 112,
      roles: ["Sentinel", "Chamber"],
      rankName: "Gold 3",
      rankIcon: "../assets/images/ranks/valorant/Gold_3_Rank.png",
      elo: "88 RR · Gold"
    }
  ],

  // 4. TAB GỢI Ý KẾT BẠN (Ô MÀU XANH) — ƯU TIÊN NGƯỜI CÓ BẠN CHUNG LÊN ĐẦU, CHƯA CÓ BẠN CHUNG XUỐNG DƯỚI
  suggestions: [
    {
      id: 401,
      name: "Mai Phương Thảo (ThaoSentinel)",
      tag: "#SAGE",
      verified: true,
      mutualFriends: 15,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=ThaoSentinel&backgroundColor=ffd5dc",
      presence: "online",
      statusText: "15 BẠN CHUNG · CÙNG CHƠI VALORANT & LOL",
      subInfo: "Bạn chung với ZeroCool, LinhBae và 13 người khác",
      game: "Valorant",
      gameLevel: 312,
      roles: ["Sentinel", "Killjoy / Cypher"],
      rankName: "Immortal 2",
      rankIcon: "../assets/images/ranks/valorant/Immortal_2_Rank.png",
      elo: "280 RR · Immortal"
    },
    {
      id: 402,
      name: "Lương Gia Khiêm (KhiemIGL)",
      tag: "#TACTIC",
      verified: true,
      mutualFriends: 14,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KhiemIGL&backgroundColor=c0aede",
      presence: "online",
      statusText: "14 BẠN CHUNG · CÙNG MỨC RANK PREMIER 30K+",
      subInfo: "Bạn chung với HuySniper và 13 người khác",
      game: "CS2",
      cs2RankLevel: 39,
      roles: ["IGL", "Support"],
      cs2Mode: "premier",
      premierScore: 30450,
      rankName: "CS2 Premier",
      elo: "Mốc Vàng (30,000+)"
    },
    {
      id: 403,
      name: "Trần Minh Đức (DucChienTuong)",
      tag: "#ELSU100",
      verified: true,
      mutualFriends: 12,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=DucChienTuong&backgroundColor=ffdfbf",
      presence: "ingame",
      statusText: "12 BẠN CHUNG · CÙNG ĐỘI TUYỂN LIÊN QUÂN TRƯỜNG",
      subInfo: "Bạn chung với NamFlorentino, PhucConqueror và 10 người khác",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Xạ Thủ", "Elsu / Violet"],
      rankName: "Chiến Tướng (Conqueror)",
      rankIcon: "../assets/images/ranks/aov/conqueror.png",
      elo: "82 Sao · Chiến Tướng"
    },
    {
      id: 404,
      name: "Hồ Anh Quân (QuanTopGod)",
      tag: "#SOLOKILL",
      verified: true,
      mutualFriends: 11,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=QuanTop&backgroundColor=b6e3f4",
      presence: "ingame",
      statusText: "11 BẠN CHUNG · HỢP VỊ TRÍ ĐỘI HÌNH CỦA BẠN",
      subInfo: "Bạn chung với TuanJungle, LinhBae và 9 người khác",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 418,
      roles: ["Top", "Aatrox / Camille"],
      rankName: "Cao Thủ (Master)",
      rankIcon: "../assets/images/ranks/lol/8.png",
      elo: "310 LP · Đơn/Đôi"
    },
    {
      id: 405,
      name: "Võ Minh Tâm (TamJungleAOV)",
      tag: "#NAKROTH",
      verified: false,
      mutualFriends: 9,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=TamJungle&backgroundColor=ffdfbf",
      presence: "online",
      statusText: "9 BẠN CHUNG · HAY CHƠI CÙNG KHUNG GIỜ 21:00",
      subInfo: "Bạn chung với NamFlorentino và 8 người khác",
      game: "Liên Quân Mobile",
      gameLevel: 30,
      roles: ["Đi Rừng", "Sát Thủ"],
      rankName: "Kim Cương I (Diamond)",
      rankIcon: "../assets/images/ranks/aov/diamond.png",
      elo: "Kim Cương I · 5 Sao"
    },
    {
      id: 406,
      name: "Đinh Tuấn Kiệt (KietAK47)",
      tag: "#SPRAY",
      verified: false,
      mutualFriends: 8,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KietM24&backgroundColor=d1d4f9",
      presence: "online",
      statusText: "8 BẠN CHUNG · CÙNG CLB ESPORTS",
      subInfo: "Bạn chung với BaoClutch và 7 người khác",
      game: "CS2",
      cs2RankLevel: 19,
      roles: ["Rifler", "Support"],
      cs2Mode: "premier",
      premierScore: 17850,
      rankName: "CS2 Premier",
      elo: "Mốc Tím (15,000 - 19,999)"
    },
    {
      id: 407,
      name: "Nguyễn Thảo Nguyên (NguyenVeres)",
      tag: "#HUYETXICH",
      verified: false,
      mutualFriends: 5,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=NguyenVeres&backgroundColor=ffd5dc",
      presence: "online",
      statusText: "5 BẠN CHUNG · CÙNG CHƠI LIÊN QUÂN BUỔI TỐI",
      subInfo: "Bạn chung với DuyenAlice và 4 người khác",
      game: "Liên Quân Mobile",
      gameLevel: 29,
      roles: ["Đấu Sĩ", "Đường Giữa"],
      rankName: "Tinh Anh III (Veteran)",
      rankIcon: "../assets/images/ranks/aov/veteran.png",
      elo: "Tinh Anh III · 4 Sao"
    },
    {
      id: 408,
      name: "Phạm Gia Huy (HuySova)",
      tag: "#RECON",
      verified: false,
      mutualFriends: 0,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HuySova&backgroundColor=b6e3f4",
      presence: "ingame",
      statusText: "GỢI Ý THEO MỨC RANK & VAI TRÒ · CHƯA CÓ BẠN CHUNG",
      subInfo: "Hay chơi: 20:00 - 23:00 · Chơi Valorant",
      game: "Valorant",
      gameLevel: 205,
      roles: ["Initiator", "Sova / Kay/O"],
      rankName: "Immortal 1",
      rankIcon: "../assets/images/ranks/valorant/Immortal_1_Rank.png",
      elo: "95 RR · Immortal"
    },
    {
      id: 409,
      name: "Lê Quốc Trung (TrungFaceit7)",
      tag: "#CLUTCH",
      verified: false,
      mutualFriends: 0,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=TrungFaceit7&backgroundColor=c0aede",
      presence: "online",
      statusText: "GỢI Ý CÙNG KHU VỰC & GAME · CHƯA CÓ BẠN CHUNG",
      subInfo: "Người chơi CS2 tích cực tại máy chủ Việt Nam · Có mic",
      game: "CS2",
      cs2RankLevel: 25,
      roles: ["Lurker", "AWPer"],
      cs2Mode: "faceit",
      rankName: "FACEIT Level 7",
      rankIcon: "../assets/images/ranks/faceit/7.svg",
      elo: "1,615 ELO"
    },
    {
      id: 410,
      name: "Bùi Khánh Hòa (HoaPlatinumAOV)",
      tag: "#ZUKA",
      verified: false,
      mutualFriends: 0,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HoaZuka&backgroundColor=ffdfbf",
      presence: "online",
      statusText: "GỢI Ý CÙNG TƯỚNG & VỊ TRÍ BỔ TRỢ · CHƯA CÓ BẠN CHUNG",
      subInfo: "Chuyên Solo Tà Thần · Đang bật chế độ tìm đồng đội leo rank",
      game: "Liên Quân Mobile",
      gameLevel: 25,
      roles: ["Solo Tà Thần", "Đi Rừng"],
      rankName: "Bạch Kim II (Platinum)",
      rankIcon: "../assets/images/ranks/aov/platinum.png",
      elo: "Bạch Kim II · 4 Sao"
    },
    {
      id: 411,
      name: "Trương Đình Phong (PhongGoldLOL)",
      tag: "#GANKER",
      verified: false,
      mutualFriends: 0,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=PhongGold&backgroundColor=d1d4f9",
      presence: "online",
      statusText: "GỢI Ý ĐỒNG ĐỘI DUO · CHƯA CÓ BẠN CHUNG",
      subInfo: "Chuyên Đi Rừng hỗ trợ đường đơn · Hòa đồng, không toxic",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 142,
      roles: ["Jungle", "Jarvan IV / Vi"],
      rankName: "Vàng (Gold)",
      rankIcon: "../assets/images/ranks/lol/4.png",
      elo: "88 LP · Vàng I"
    },
    {
      id: 412,
      name: "Đặng Minh Khôi (KhoiLightBlueCS2)",
      tag: "#CS2NEW",
      verified: false,
      mutualFriends: 0,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=KhoiCS2&backgroundColor=b6e3f4",
      presence: "offline",
      statusText: "GỢI Ý NGƯỜI CHƠI CÙNG SỞ THÍCH · CHƯA CÓ BẠN CHUNG",
      subInfo: "Hay bắn CS2 Premier cuối tuần · Map tủ Mirage & Dust2",
      game: "CS2",
      cs2RankLevel: 14,
      roles: ["Rifler", "Entry"],
      cs2Mode: "premier",
      premierScore: 8450,
      rankName: "CS2 Premier",
      elo: "Mốc Xanh Nhạt (5,000 - 9,999)"
    },
    {
      id: 413,
      name: "Lê Minh Hoàng (HoangTFTMaster)",
      tag: "#FAST9",
      verified: true,
      mutualFriends: 10,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=HoangTFT&backgroundColor=ffdfbf",
      presence: "online",
      statusText: "10 BẠN CHUNG · CÙNG CHƠI ĐẤU TRƯỜNG CHÂN LÝ",
      subInfo: "Bạn chung với PhucChessGod, LinhBae và 8 người khác",
      game: "Đấu Trường Chân Lý",
      gameLevel: 276,
      roles: ["Fast 8 / Fast 9", "Xếp Hạng Đơn"],
      rankName: "Đại Cao Thủ (Grandmaster)",
      rankIcon: "../assets/images/ranks/lol/9.png",
      elo: "680 LP · ĐTCL Mùa Mới"
    }
  ],

  // 5. TAB DANH SÁCH CHẶN — những người bạn đã chặn (có thể bỏ chặn)
  blocked: [
    {
      id: 501,
      name: "Nguyễn Văn Toxic (ToxicKing)",
      tag: "#TOXIC",
      verified: false,
      mutualFriends: 0,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=ToxicKing&backgroundColor=d1d4f9",
      presence: "offline",
      statusText: "ĐÃ CHẶN 3 NGÀY TRƯỚC",
      subInfo: "",
      game: "Valorant",
      gameLevel: 120,
      roles: ["Duelist"],
      rankName: "Gold 2",
      rankIcon: "../assets/images/ranks/valorant/Gold_2_Rank.png",
      elo: "40 RR · Gold"
    },
    {
      id: 502,
      name: "Lê Quang Ping (SpamPing)",
      tag: "#PING",
      verified: false,
      mutualFriends: 2,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=SpamPing&backgroundColor=ffd5dc",
      presence: "offline",
      statusText: "ĐÃ CHẶN 1 TUẦN TRƯỚC",
      subInfo: "",
      game: "Liên Minh Huyền Thoại",
      gameLevel: 210,
      roles: ["ADC"],
      rankName: "Bạc (Silver)",
      rankIcon: "../assets/images/ranks/lol/3.png",
      elo: "30 LP · Đơn/Đôi"
    },
    {
      id: 503,
      name: "Phạm Văn Sus (SusAimbot)",
      tag: "#SUS",
      verified: false,
      mutualFriends: 0,
      avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=SusAimbot&backgroundColor=ffdfbf",
      presence: "offline",
      statusText: "ĐÃ CHẶN 2 TUẦN TRƯỚC",
      subInfo: "",
      game: "CS2",
      cs2RankLevel: 12,
      roles: ["Rifler"],
      cs2Mode: "faceit",
      rankName: "FACEIT Level 4",
      rankIcon: "../assets/images/ranks/faceit/4.svg",
      elo: "1,050 ELO"
    }
  ]
};

// Trạng thái bộ lọc & phân trang hiện tại
let currentTab = "friends";
let searchQuery = "";
let selectedGame = "ALL";
let selectedStatus = "ALL";
let currentPage = 1;
let pageSize = 6;

const TAB_CONFIG = {
  friends: {
    heading: "DANH SÁCH BẠN BÈ",
    summaryPrefix: "Người bạn đang kết nối"
  },
  received: {
    heading: "LỜI MỜI KẾT BẠN ĐẾN",
    summaryPrefix: "Lời mời đang chờ bạn xác nhận"
  },
  sent: {
    heading: "LỜI MỜI ĐÃ GỬI",
    summaryPrefix: "Lời mời đang chờ đối phương đồng ý"
  },
  suggestions: {
    heading: "GỢI Ý KẾT BẠN",
    summaryPrefix: "Ưu tiên người có bạn chung lên đầu, chưa có bạn chung ở dưới"
  },
  blocked: {
    heading: "DANH SÁCH CHẶN",
    summaryPrefix: "Người bị chặn không thể liên hệ với bạn"
  }
};

// =========================================================================
// Hàm tạo khung SVG CS2 Premier (từ premier/premier_rating_bg.svg của repo)
// Tự động đổi màu theo con số điểm (Grey / Light Blue / Blue / Purple / Pink / Red / Gold)
// =========================================================================
function getPremierPalette(score) {
  if (score >= 30000) {
    return { bar: "#ffd700", bg1: "#6b5300", bg2: "#2e2300", stripe: "#b89000", text: "#ffe766" }; // Vàng Gold 30k+
  }
  if (score >= 25000) {
    return { bar: "#eb4b4b", bg1: "#5e1919", bg2: "#290a0a", stripe: "#9e2a2a", text: "#ff8080" }; // Đỏ 25k-29k
  }
  if (score >= 20000) {
    return { bar: "#d32ce6", bg1: "#521259", bg2: "#240729", stripe: "#8f1d9c", text: "#f58aff" }; // Hồng 20k-24k
  }
  if (score >= 15000) {
    return { bar: "#8847ff", bg1: "#341b66", bg2: "#160a2e", stripe: "#5b2eb0", text: "#bca0ff" }; // Tím 15k-19k
  }
  if (score >= 10000) {
    return { bar: "#4b69ff", bg1: "#1c2866", bg2: "#0b102e", stripe: "#3246ad", text: "#99acff" }; // Xanh dương 10k-14k
  }
  if (score >= 5000) {
    return { bar: "#5e98d9", bg1: "#223852", bg2: "#0e1824", stripe: "#3b628f", text: "#a8d0ff" }; // Xanh nhạt 5k-9k
  }
  return { bar: "#b0c3d9", bg1: "#3b424a", bg2: "#1b1e21", stripe: "#636e7a", text: "#dce8f5" }; // Xám <5k
}

function renderPremierBadge(score) {
  const num = Number(score) || 0;
  const pal = getPremierPalette(num);
  const thousands = Math.floor(num / 1000);
  const remainder = String(num % 1000).padStart(3, "0");

  return `
    <div class="fc-premier-svg-wrap" title="CS2 Premier Rating: ${num.toLocaleString("en-US")}">
      <svg viewBox="0 0 178 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 0H21L9 64H13L25 0Z" fill="${pal.bg2}"/>
        <path d="M178 0H34L22 64H166L178 0Z" fill="${pal.bg1}"/>
        <path d="M176.25 1.5H33.24L21.6562 62.5H164.666L176.25 1.5Z" fill="${pal.bg2}" fill-opacity="0.65"/>
        <path opacity="0.35" d="M46.1141 4L54 4L40.8859 61H33L46.1141 4Z" fill="${pal.stripe}"/>
        <path opacity="0.55" d="M36.7301 4L42 4L30.2699 61H25L36.7301 4Z" fill="${pal.stripe}"/>
        <path opacity="0.35" d="M56.8737 4L72 4L59.1263 61H44L56.8737 4Z" fill="${pal.stripe}"/>
        <path opacity="0.25" d="M75.7813 4L110 4L97.2187 61H63L75.7813 4Z" fill="${pal.stripe}"/>
        <path d="M12 0H21L9 64H0L12 0Z" fill="${pal.bar}"/>
        <path d="M25 0H34L22 64H13L25 0Z" fill="${pal.bar}"/>
      </svg>
      <span class="fc-premier-score-text" style="color: ${pal.text};">
        ${thousands}<small>,${remainder}</small>
      </span>
    </div>
  `;
}

// Hiển thị thông báo nhanh (Toast)
function showFcToast(message) {
  const container = document.getElementById("fc-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "fc-toast";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

// Xử lý Chế độ Sáng / Tối (Light / Dark Mode) qua menu Avatar
function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("fc-light-mode", isLight);

  const checkDark = document.getElementById("check-theme-dark");
  const checkLight = document.getElementById("check-theme-light");
  if (checkDark && checkLight) {
    checkDark.textContent = isLight ? "" : "✓";
    checkLight.textContent = isLight ? "✓" : "";
  }

  document.querySelectorAll(".fc-theme-option").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.setTheme === theme);
  });

  localStorage.setItem("gc_friends_theme", theme);
}

// Bản đồ Logo của từng Game
const GAME_LOGOS = {
  "Valorant": "../assets/images/games/valorant.png",
  "Liên Minh Huyền Thoại": "../assets/images/games/lol.png",
  "Đấu Trường Chân Lý": "../assets/images/games/tft.png",
  "CS2": "../assets/images/games/cs2.png",
  "Liên Quân Mobile": "../assets/images/games/aov.png"
};

// Cấu hình các mục trong Custom Dropdown Lọc Game & Trạng thái (Dùng Logo thật thay cho chữ viết tắt)
const GAME_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả game", logo: null },
  { value: "Valorant", label: "Valorant", logo: GAME_LOGOS["Valorant"] },
  { value: "Liên Minh Huyền Thoại", label: "Liên Minh Huyền Thoại", logo: GAME_LOGOS["Liên Minh Huyền Thoại"] },
  { value: "Đấu Trường Chân Lý", label: "Đấu Trường Chân Lý (TFT)", logo: GAME_LOGOS["Đấu Trường Chân Lý"] },
  { value: "CS2", label: "Counter-Strike 2", logo: GAME_LOGOS["CS2"] },
  { value: "Liên Quân Mobile", label: "Liên Quân Mobile", logo: GAME_LOGOS["Liên Quân Mobile"] }
];

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Mọi trạng thái", dotClass: "is-all" },
  { value: "online", label: "Đang Online / Trong phòng", dotClass: "is-online" },
  { value: "offline", label: "Offline", dotClass: "is-offline" }
];

function renderDropdownGameIcon(opt) {
  if (!opt.logo) {
    return `
      <svg class="fc-dd-all-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
    `;
  }
  return `<img src="${opt.logo}" alt="${escapeHtml(opt.label)}" class="fc-dd-game-logo">`;
}

// Render nội dung & số đếm người chơi trong 2 Custom Dropdown
function renderFilterDropdowns() {
  const rawList = MOCK_DATA[currentTab] || [];

  // 1. Dropdown Game
  const gameLabelEl = document.getElementById("label-dropdown-game");
  const gameMenuEl = document.getElementById("menu-dropdown-game");
  if (gameLabelEl && gameMenuEl) {
    const activeGameOpt = GAME_FILTER_OPTIONS.find((o) => o.value === selectedGame) || GAME_FILTER_OPTIONS[0];
    gameLabelEl.innerHTML = `
      ${renderDropdownGameIcon(activeGameOpt)}
      <span>${escapeHtml(activeGameOpt.label)}</span>
    `;

    gameMenuEl.innerHTML = GAME_FILTER_OPTIONS.map((opt) => {
      const isActive = opt.value === selectedGame;
      return `
        <button type="button" class="fc-dropdown-item ${isActive ? "active" : ""}" data-filter-game="${escapeHtml(opt.value)}">
          <span class="fc-dropdown-item-left">
            ${renderDropdownGameIcon(opt)}
            <span>${escapeHtml(opt.label)}</span>
          </span>
          <span class="fc-dropdown-item-right">
            <span class="fc-dd-check">${isActive ? "✓" : ""}</span>
          </span>
        </button>
      `;
    }).join("");
  }

  // 2. Dropdown Trạng thái
  const statusLabelEl = document.getElementById("label-dropdown-status");
  const statusMenuEl = document.getElementById("menu-dropdown-status");
  if (statusLabelEl && statusMenuEl) {
    const activeStatusOpt = STATUS_FILTER_OPTIONS.find((o) => o.value === selectedStatus) || STATUS_FILTER_OPTIONS[0];
    statusLabelEl.innerHTML = `
      <span class="fc-dd-dot ${activeStatusOpt.dotClass}"></span>
      <span>${escapeHtml(activeStatusOpt.label)}</span>
    `;

    statusMenuEl.innerHTML = STATUS_FILTER_OPTIONS.map((opt) => {
      const count =
        opt.value === "ALL"
          ? rawList.length
          : opt.value === "online"
          ? rawList.filter((p) => p.presence === "online" || p.presence === "ingame").length
          : rawList.filter((p) => p.presence === "offline").length;
      const isActive = opt.value === selectedStatus;
      return `
        <button type="button" class="fc-dropdown-item ${isActive ? "active" : ""}" data-filter-status="${escapeHtml(opt.value)}">
          <span class="fc-dropdown-item-left">
            <span class="fc-dd-dot ${opt.dotClass}"></span>
            <span>${escapeHtml(opt.label)}</span>
          </span>
          <span class="fc-dropdown-item-right">
            <span class="fc-dd-count">${count}</span>
            <span class="fc-dd-check">${isActive ? "✓" : ""}</span>
          </span>
        </button>
      `;
    }).join("");
  }
}

// Cập nhật số đếm trên 4 tab và thanh bên
function updateCounters() {
  document.getElementById("count-friends").textContent = MOCK_DATA.friends.length;
  document.getElementById("count-received").textContent = MOCK_DATA.received.length;
  document.getElementById("count-sent").textContent = MOCK_DATA.sent.length;
  document.getElementById("count-suggestions").textContent = MOCK_DATA.suggestions.length;
  const countBlockedEl = document.getElementById("count-blocked");
  if (countBlockedEl) countBlockedEl.textContent = MOCK_DATA.blocked.length;

  const sidebarBadge = document.getElementById("sidebar-req-badge");
  if (sidebarBadge) {
    const recCount = MOCK_DATA.received.length;
    sidebarBadge.textContent = recCount;
    sidebarBadge.style.display = recCount > 0 ? "flex" : "none";
  }

  renderFilterDropdowns();
}

// Tạo nút bấm tương ứng với từng Tab
function renderActionsForTab(player, tab) {
  if (tab === "blocked") {
    return `
      <button class="fc-btn fc-btn-secondary" data-action="unblock" data-id="${player.id}">
        Bỏ chặn
      </button>
    `;
  }

  if (tab === "friends") {
    const mainBtn = player.inRoom
      ? `<button class="fc-btn fc-btn-join" data-action="join-room" data-id="${player.id}">
        Xin vào phòng
      </button>`
      : `<button class="fc-btn fc-btn-primary" data-action="invite" data-id="${player.id}">
        + Mời vào đội
      </button>`;
    return `
      ${mainBtn}
      <button class="fc-btn fc-btn-secondary" data-action="message" data-id="${player.id}">
        Nhắn tin
      </button>
      <button class="fc-btn fc-btn-danger-ghost fc-btn-icon" data-action="unfriend" data-id="${player.id}" title="Hủy kết bạn">
        ✕
      </button>
    `;
  }

  if (tab === "received") {
    return `
      <button class="fc-btn fc-btn-primary" data-action="accept" data-id="${player.id}">
        ✓ Chấp nhận
      </button>
      <button class="fc-btn fc-btn-danger-ghost" data-action="reject" data-id="${player.id}">
        Từ chối
      </button>
    `;
  }

  if (tab === "sent") {
    return `
      <span style="font-size: 12.5px; color: var(--fc-text-muted); margin-right: 6px; font-weight: 700;">Đang chờ...</span>
      <button class="fc-btn fc-btn-danger-ghost" data-action="cancel-sent" data-id="${player.id}">
        Hủy lời mời
      </button>
    `;
  }

  // suggestions (Gợi ý bạn chung)
  return `
    <button class="fc-btn fc-btn-primary" data-action="add-friend" data-id="${player.id}">
      + Kết bạn
    </button>
    <button class="fc-btn fc-btn-danger-ghost fc-btn-icon" data-action="dismiss-suggestion" data-id="${player.id}" title="Ẩn gợi ý">
      ✕
    </button>
  `;
}

// Lấy tên quân hàm & màu sắc theo cấp độ CS2 (1..40)
function getCs2ProfileRankMeta(lv) {
  if (lv >= 36) return { tierClass: "cs2-tier-gold", title: "General" };
  if (lv >= 31) return { tierClass: "cs2-tier-gold", title: "Colonel" };
  if (lv >= 26) return { tierClass: "cs2-tier-purple", title: "Major" };
  if (lv >= 21) return { tierClass: "cs2-tier-purple", title: "Captain" };
  if (lv >= 11) return { tierClass: "cs2-tier-blue", title: "Sergeant" };
  return { tierClass: "cs2-tier-blue", title: "Corporal" };
}

// Render cột Tên Game (Cột 2): Nếu CS2 thì hiện icon 20px từ folder ranks/ kèm màu theo mốc cấp, còn game khác thì hiện Huy hiệu Cấp đặc trưng từng game
function renderGameHeaderBadge(player) {
  if (player.game === "CS2") {
    const lv = player.cs2RankLevel || 40;
    const meta = getCs2ProfileRankMeta(lv);
    return `
      <span class="fc-cs2-game-rank-pill ${meta.tierClass}" title="CS2 Profile Rank ${lv} (${meta.title})">
        <img src="../assets/images/ranks/cs2/ranks/${lv}.png" alt="CS2 Rank ${lv}" class="fc-cs2-game-rank-img">
        <span>Rank ${lv}</span>
      </span>
    `;
  }

  const levelText = player.gameLevel ?? 100;

  if (player.game === "Valorant") {
    return `
      <span class="fc-game-level-pill lv-valorant" title="Cấp tài khoản Valorant (Account Level)">
        <svg class="fc-level-icon-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L20 7V17L12 22L4 17V7L12 2ZM12 5.2L6.8 8.4V15.6L12 18.8L17.2 15.6V8.4L12 5.2Z"/>
        </svg>
        <span>AP ${escapeHtml(String(levelText))}</span>
      </span>
    `;
  }

  if (player.game === "Liên Minh Huyền Thoại") {
    return `
      <span class="fc-game-level-pill lv-lol" title="Cấp Anh Hùng Liên Minh Huyền Thoại">
        <svg class="fc-level-icon-svg" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 15,8 22,9 17,14 18,21 12,17.5 6,21 7,14 2,9 9,8"/>
        </svg>
        <span>Cấp ${escapeHtml(String(levelText))}</span>
      </span>
    `;
  }

  if (player.game === "Đấu Trường Chân Lý") {
    return `
      <span class="fc-game-level-pill lv-tft" title="Cấp độ Đấu Trường Chân Lý (TFT)">
        <svg class="fc-level-icon-svg" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 15,8 22,9 17,14 18,21 12,17.5 6,21 7,14 2,9 9,8"/>
        </svg>
        <span>Cấp ${escapeHtml(String(levelText))}</span>
      </span>
    `;
  }

  return `
    <span class="fc-game-level-pill lv-aov" title="Cấp độ Kiện Tướng Liên Quân Mobile">
      <svg class="fc-level-icon-svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
      <span>Cấp ${escapeHtml(String(levelText))}</span>
    </span>
  `;
}

// Huy hiệu xác thực: tích vàng cho người nổi bật (nhiều bạn chung hoặc rank rất cao), tích xanh cho người đã xác thực còn lại
function getVerifiedTier(player) {
  if (!player.verified) return null;
  const topRank = /Immortal|Radiant|Challenger|Grandmaster|Master|Cao Thủ|Thách Đấu|Level 10/i.test(player.rankName || "");
  const topPremier = player.cs2Mode === "premier" && Number(player.premierScore) >= 20000;
  const manyMutual = Number(player.mutualFriends) >= 10;
  return topRank || topPremier || manyMutual ? "gold" : "blue";
}

function renderVerifiedBadge(player) {
  const tier = getVerifiedTier(player);
  if (!tier) return "";
  const isGold = tier === "gold";
  const title = isGold ? "Game thủ nổi bật đã xác thực" : "Game thủ đã xác thực";
  const src = isGold ? "../assets/images/badges/verified-gold.png" : "../assets/images/badges/verified-blue.png";
  return `<img src="${src}" alt="${title}" title="${title}" class="fc-verified-badge">`;
}

// Render cột Mức Rank (Cột 3): Người chơi CS2 chỉ hiện 1 trong 2 (FACEIT hoặc Premier)
function renderRankBadgeColumn(player) {
  if (player.game === "CS2" && player.cs2Mode === "premier") {
    return renderPremierBadge(player.premierScore);
  }

  return `
    <div class="fc-rank-badges-wrap">
      <img
        src="${player.rankIcon}"
        alt="${escapeHtml(player.rankName)}"
        class="fc-rank-icon-img"
        title="${escapeHtml(player.rankName)}"
      >
    </div>
  `;
}

// Render thanh Phân Trang (Pagination)
function renderPagination(totalItems, totalPages, startIdx, endIdx) {
  const paginationEl = document.getElementById("pagination-container");
  if (!paginationEl) return;

  if (totalItems === 0) {
    paginationEl.innerHTML = "";
    return;
  }

  let pageButtonsHtml = "";
  for (let p = 1; p <= totalPages; p++) {
    const activeClass = p === currentPage ? "active" : "";
    pageButtonsHtml += `
      <button type="button" class="fc-page-btn ${activeClass}" data-page="${p}">
        ${p}
      </button>
    `;
  }

  paginationEl.innerHTML = `
    <div class="fc-page-info">
      Trang <strong>${currentPage} / ${totalPages}</strong> · Hiển thị <strong>${startIdx + 1}–${endIdx}</strong> trên tổng <strong>${totalItems}</strong> người chơi
    </div>
    <div class="fc-page-controls">
      <button type="button" class="fc-page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>
        « Trước
      </button>
      ${pageButtonsHtml}
      <button type="button" class="fc-page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>
        Sau »
      </button>
      <select id="page-size-select" class="fc-page-size-select" aria-label="Số người chơi mỗi trang">
        <option value="6" ${pageSize === 6 ? "selected" : ""}>6 / trang</option>
        <option value="10" ${pageSize === 10 ? "selected" : ""}>10 / trang</option>
        <option value="15" ${pageSize === 15 ? "selected" : ""}>15 / trang</option>
      </select>
    </div>
  `;
}

// Trạng thái hiển thị ở tab Bạn bè: chỉ "Đang trong phòng" hoặc "Đang trực tuyến" (offline thì không hiện)
function getFriendStatusLine(player) {
  if (player.presence !== "online" && player.presence !== "ingame") return null;
  if (player.inRoom) {
    return { key: "inroom", text: "ĐANG TRONG PHÒNG" };
  }
  return { key: "online", text: "ĐANG TRỰC TUYẾN" };
}

// Số bạn chung: ưu tiên trường mutualFriends, nếu chưa có thì suy ra từ mô tả cũ ("12 bạn chung" / "Bạn chung với A, B và 13 người khác")
function getMutualCount(player) {
  if (typeof player.mutualFriends === "number") return player.mutualFriends;
  const text = player.subInfo || "";
  const direct = text.match(/(\d+)\s*bạn chung/i);
  if (direct) return Number(direct[1]);
  const named = text.match(/^Bạn chung với (.+?)(?: và (\d+) người khác)?$/i);
  if (named) {
    const names = named[1].split(",").filter((n) => n.trim()).length;
    return names + (named[2] ? Number(named[2]) : 0);
  }
  return 0;
}

// Dòng mô tả dưới tên: đang trong phòng -> bài tìm phòng mới nhất; còn lại -> số bạn chung (không có thì không hiện)
function renderPlayerSubInfo(player) {
  let text = "";
  if (player.inRoom && player.roomPost) {
    text = player.roomPost;
  } else {
    const mutual = getMutualCount(player);
    if (mutual > 0) text = `${mutual} bạn chung`;
  }
  return text ? `<div class="fc-player-desc">${escapeHtml(text)}</div>` : "";
}

// Render danh sách người chơi theo tab + bộ lọc + phân trang
function renderPlayerList() {
  updateCounters();

  const listEl = document.getElementById("players-list-container");
  const headingEl = document.getElementById("section-heading");
  const summaryEl = document.getElementById("tab-summary-text");

  const config = TAB_CONFIG[currentTab];
  headingEl.textContent = config.heading;

  const rawList = MOCK_DATA[currentTab] || [];

  const filtered = rawList.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      item.game.toLowerCase().includes(q) ||
      item.rankName.toLowerCase().includes(q) ||
      item.roles.some((r) => r.toLowerCase().includes(q));

    const matchGame = selectedGame === "ALL" || item.game === selectedGame;

    const matchStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "online" && (item.presence === "online" || item.presence === "ingame")) ||
      (selectedStatus === "offline" && item.presence === "offline");

    return matchSearch && matchGame && matchStatus;
  });

  // Nếu ở tab Gợi ý kết bạn: Tự động xếp những người có bạn chung (> 0) lên đầu theo số bạn chung giảm dần, người không có bạn chung (0) xuống dưới
  if (currentTab === "suggestions") {
    filtered.sort((a, b) => {
      const mA = a.mutualFriends || 0;
      const mB = b.mutualFriends || 0;
      return mB - mA;
    });
  }

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageItems = filtered.slice(startIdx, endIdx);

  summaryEl.textContent = `Tổng ${totalItems} / ${rawList.length} — ${config.summaryPrefix}`;

  if (totalItems === 0) {
    listEl.innerHTML = `
      <div class="fc-empty-state">
        <h3>${currentTab === "blocked" && rawList.length === 0 ? "Bạn chưa chặn ai" : "Không tìm thấy người chơi nào"}</h3>
        <p>${currentTab === "blocked" && rawList.length === 0 ? "Những người bạn chặn sẽ xuất hiện ở đây và bạn có thể bỏ chặn bất cứ lúc nào." : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc game / trạng thái ở phía trên."}</p>
      </div>
    `;
    renderPagination(0, 1, 0, 0);
    return;
  }

  listEl.innerHTML = pageItems
    .map((player) => {
      // Tab Bạn bè: chỉ có 2 trạng thái thật (Đang trực tuyến / Đang trong phòng), người offline không hiện chữ
      const friendStatus = currentTab === "friends" ? getFriendStatusLine(player) : null;

      const presenceClass =
        currentTab === "blocked"
          ? "fc-presence-offline"
          : currentTab === "friends"
          ? friendStatus
            ? friendStatus.key === "inroom"
              ? "fc-presence-ingame"
              : "fc-presence-online"
            : "fc-presence-offline"
          : player.presence === "ingame"
          ? "fc-presence-ingame"
          : player.presence === "online"
          ? "fc-presence-online"
          : "fc-presence-offline";

      const subheadStatusClass =
        currentTab === "blocked"
          ? "is-blocked"
          : currentTab === "friends"
          ? friendStatus
            ? friendStatus.key === "inroom"
              ? "is-inroom"
              : "is-online"
            : ""
          : player.presence === "ingame"
          ? "is-ingame"
          : player.presence === "online"
          ? "is-online"
          : "";

      const subheadText = currentTab === "friends" ? (friendStatus ? friendStatus.text : "") : player.statusText;
      const subheadHtml = subheadText
        ? `<div class="fc-player-subhead ${subheadStatusClass}">${escapeHtml(subheadText)}</div>`
        : "";

      const roleBadges = player.roles
        .map((r) => `<span class="fc-role-tag">${escapeHtml(r)}</span>`)
        .join("");

      return `
        <article class="fc-player-row ${currentTab === "blocked" ? "is-blocked" : ""}">
          <!-- Cột 1: Avatar + Tên + Trạng thái / Bạn chung -->
          <div class="fc-player-identity">
            <div class="fc-avatar-box">
              <img src="${player.avatar}" alt="${escapeHtml(player.name)}" class="fc-avatar-img" loading="lazy">
              <span class="fc-presence-badge ${presenceClass}"></span>
            </div>
            <div class="fc-player-meta">
              ${subheadHtml}
              <div class="fc-player-name-row">
                <span class="fc-player-name">${escapeHtml(player.name)}</span>
                <span style="font-size: 12.5px; color: var(--fc-text-muted); font-weight: 700;">${escapeHtml(player.tag)}</span>
                ${renderVerifiedBadge(player)}
              </div>
              ${renderPlayerSubInfo(player)}
            </div>
          </div>

          <!-- Cột 2: Tên Game + Logo Game + Ranks (nếu CS2) hoặc Cấp (nếu game khác) + Role -->
          <div class="fc-player-games">
            <div class="fc-game-main">
              ${GAME_LOGOS[player.game] ? `<img src="${GAME_LOGOS[player.game]}" alt="${escapeHtml(player.game)}" class="fc-row-game-logo">` : '<span class="fc-game-dot"></span>'}
              <span>${escapeHtml(player.game)}</span>
              ${renderGameHeaderBadge(player)}
            </div>
            <div class="fc-role-tags">
              ${roleBadges}
            </div>
          </div>

          <!-- Cột 3: Mức Rank (CS2 chỉ chọn 1 trong 2: FACEIT hoặc Premier đổi màu theo số) -->
          <div class="fc-player-rank">
            ${renderRankBadgeColumn(player)}
            <div class="fc-rank-info">
              <div class="fc-rank-title-row">
                <span class="fc-rank-title">${escapeHtml(player.rankName)}</span>
              </div>
              <span class="fc-rank-elo">${escapeHtml(player.elo)}</span>
            </div>
          </div>

          <!-- Cột 4: Nút thao tác -->
          <div class="fc-player-actions">
            ${renderActionsForTab(player, currentTab)}${currentTab === "blocked" ? "" : renderMoreMenu(player)}
          </div>
        </article>
      `;
    })
    .join("");

  renderPagination(totalItems, totalPages, startIdx, endIdx);
}

// =========================================================================
// Chặn / Bỏ chặn & Xem hồ sơ (UI mẫu — chưa nối Backend)
// =========================================================================
let modalPendingId = null;

// Nút 3 chấm nhỏ ở mỗi người chơi: rê chuột vào (hoặc bấm) để mở menu Xem hồ sơ / Chặn
function renderMoreMenu(player) {
  return `
    <div class="fc-more-wrap">
      <button type="button" class="fc-more-btn" data-more-toggle aria-haspopup="true" aria-label="Tùy chọn khác" title="Tùy chọn khác">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"></circle>
          <circle cx="12" cy="12" r="1.8"></circle>
          <circle cx="19" cy="12" r="1.8"></circle>
        </svg>
      </button>
      <div class="fc-more-menu" role="menu">
        <button type="button" class="fc-more-item" role="menuitem" data-action="view-profile" data-id="${player.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Xem hồ sơ</span>
        </button>
        <button type="button" class="fc-more-item is-danger" role="menuitem" data-action="block-ask" data-id="${player.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
          <span>Chặn</span>
        </button>
      </div>
    </div>
  `;
}

function closeAllMoreMenus() {
  document.querySelectorAll(".fc-more-wrap.is-open").forEach((w) => w.classList.remove("is-open"));
}

// Tìm người chơi ở bất kỳ tab nào (id là duy nhất giữa các tab)
function findPlayerAnywhere(id) {
  const keys = ["friends", "received", "sent", "suggestions", "blocked"];
  for (const key of keys) {
    const found = (MOCK_DATA[key] || []).find((x) => x.id === id);
    if (found) return found;
  }
  return null;
}

function openModal(html) {
  const root = document.getElementById("fc-modal");
  const card = document.getElementById("fc-modal-card");
  if (!root || !card) return;
  card.innerHTML = html;
  root.hidden = false;
}

function closeModal() {
  const root = document.getElementById("fc-modal");
  if (root) root.hidden = true;
  modalPendingId = null;
}

// Hộp xác nhận chặn
function openBlockConfirm(player) {
  modalPendingId = player.id;
  openModal(`
    <div class="fc-modal-head">
      <img src="${player.avatar}" alt="${escapeHtml(player.name)}" class="fc-modal-avatar">
      <div>
        <h3>Chặn ${escapeHtml(player.name)}?</h3>
        <p>${escapeHtml(player.tag)}</p>
      </div>
    </div>
    <ul class="fc-modal-list">
      <li>Hai bên không thể mời kết bạn, mời vào đội hay nhắn tin cho nhau.</li>
      <li>Nếu đang là bạn bè, hai người sẽ bị huỷ kết bạn.</li>
      <li>Bạn có thể bỏ chặn bất cứ lúc nào trong tab “Danh sách chặn”.</li>
    </ul>
    <div class="fc-modal-actions">
      <button type="button" class="fc-btn fc-btn-secondary" data-modal-close>Hủy</button>
      <button type="button" class="fc-btn fc-btn-danger" data-modal-confirm-block>Chặn</button>
    </div>
  `);
}

// Hộp hồ sơ nhỏ (dữ liệu mẫu)
function openProfile(player) {
  modalPendingId = player.id;
  const roleBadges = player.roles.map((r) => `<span class="fc-role-tag">${escapeHtml(r)}</span>`).join("");
  const mutual = getMutualCount(player);
  const gameLogo = GAME_LOGOS[player.game]
    ? `<img src="${GAME_LOGOS[player.game]}" alt="${escapeHtml(player.game)}" class="fc-row-game-logo">`
    : "";

  openModal(`
    <div class="fc-modal-head">
      <img src="${player.avatar}" alt="${escapeHtml(player.name)}" class="fc-modal-avatar">
      <div>
        <h3>${escapeHtml(player.name)} ${renderVerifiedBadge(player)}</h3>
        <p>${escapeHtml(player.tag)}${mutual > 0 ? ` · ${mutual} bạn chung` : ""}</p>
      </div>
    </div>

    <div class="fc-profile-block">
      <span class="fc-profile-label">Game chính</span>
      <div class="fc-game-main">${gameLogo}<span>${escapeHtml(player.game)}</span>${renderGameHeaderBadge(player)}</div>
      <div class="fc-role-tags">${roleBadges}</div>
    </div>

    <div class="fc-profile-block">
      <span class="fc-profile-label">Mức rank</span>
      <div class="fc-player-rank">
        ${renderRankBadgeColumn(player)}
        <div class="fc-rank-info">
          <span class="fc-rank-title">${escapeHtml(player.rankName)}</span>
          <span class="fc-rank-elo">${escapeHtml(player.elo)}</span>
        </div>
      </div>
    </div>

    <div class="fc-modal-actions">
      <button type="button" class="fc-btn fc-btn-secondary" data-modal-close>Đóng</button>
      <button type="button" class="fc-btn fc-btn-danger-ghost" data-modal-block-profile>Chặn</button>
    </div>
  `);
}

// Chặn: bỏ người này khỏi mọi tab, chuyển vào danh sách chặn (đang là bạn thì huỷ kết bạn)
function blockPlayer(id) {
  let target = null;
  ["friends", "received", "sent", "suggestions"].forEach((key) => {
    const idx = MOCK_DATA[key].findIndex((x) => x.id === id);
    if (idx !== -1) {
      const [removed] = MOCK_DATA[key].splice(idx, 1);
      if (!target) target = removed;
    }
  });
  if (!target) return;

  target.presence = "offline";
  target.inRoom = false;
  target.statusText = "ĐÃ CHẶN VỪA XONG";
  MOCK_DATA.blocked.unshift(target);

  showFcToast(`🚫 Đã chặn ${target.name}`);
  renderPlayerList();
}

// Bỏ chặn: đưa về tab Gợi ý kết bạn (không tự động thành bạn bè)
function unblockPlayer(id) {
  const idx = MOCK_DATA.blocked.findIndex((x) => x.id === id);
  if (idx === -1) return;
  const [target] = MOCK_DATA.blocked.splice(idx, 1);
  target.statusText = "ĐÃ BỎ CHẶN · CÓ THỂ KẾT BẠN LẠI";
  MOCK_DATA.suggestions.unshift(target);

  showFcToast(`✅ Đã bỏ chặn ${target.name}. Bạn có thể tìm thấy họ ở tab Gợi ý kết bạn`);
  renderPlayerList();
}

// Gắn sự kiện cho menu 3 chấm & hộp thoại
function initBlockUi() {
  const list = document.getElementById("players-list-container");
  list.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-more-toggle]");
    if (!toggle) return;
    e.stopPropagation();
    const wrap = toggle.closest(".fc-more-wrap");
    const willOpen = !wrap.classList.contains("is-open");
    closeAllMoreMenus();
    wrap.classList.toggle("is-open", willOpen);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".fc-more-wrap")) closeAllMoreMenus();
  });

  const modalRoot = document.getElementById("fc-modal");
  if (!modalRoot) return;

  modalRoot.addEventListener("click", (e) => {
    if (e.target === modalRoot || e.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }
    if (e.target.closest("[data-modal-confirm-block]")) {
      const id = modalPendingId;
      closeModal();
      if (id !== null) blockPlayer(id);
      return;
    }
    if (e.target.closest("[data-modal-block-profile]")) {
      const p = findPlayerAnywhere(modalPendingId);
      if (p) openBlockConfirm(p);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalRoot.hidden) closeModal();
  });
}

// Chuyển đổi giữa các Tab
function switchTab(tabName) {
  if (!TAB_CONFIG[tabName]) return;
  currentTab = tabName;
  currentPage = 1;

  document.querySelectorAll(".fc-tab-btn").forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  renderPlayerList();
}

// Xử lý sự kiện click trên các nút thao tác của từng hàng người chơi
function handlePlayerAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === "view-profile") {
    closeAllMoreMenus();
    const p = findPlayerAnywhere(id);
    if (p) openProfile(p);
    return;
  }

  if (action === "block-ask") {
    closeAllMoreMenus();
    const p = findPlayerAnywhere(id);
    if (p) openBlockConfirm(p);
    return;
  }

  if (action === "unblock") {
    unblockPlayer(id);
    return;
  }

  if (action === "invite") {
    const p = MOCK_DATA.friends.find((x) => x.id === id);
    if (p) showFcToast(`🎮 Đã gửi lời mời vào tổ đội cho ${p.name}`);
    return;
  }

  if (action === "join-room") {
    const p = MOCK_DATA.friends.find((x) => x.id === id);
    if (p) showFcToast(`🚪 Đã gửi yêu cầu xin vào phòng của ${p.name}`);
    return;
  }

  if (action === "message") {
    const p = MOCK_DATA.friends.find((x) => x.id === id);
    if (p) showFcToast(`💬 Đang mở khung chat với ${p.name}...`);
    return;
  }

  if (action === "unfriend") {
    const idx = MOCK_DATA.friends.findIndex((x) => x.id === id);
    if (idx !== -1) {
      const removed = MOCK_DATA.friends.splice(idx, 1)[0];
      showFcToast(`Đã hủy kết bạn với ${removed.name}`);
      renderPlayerList();
    }
    return;
  }

  if (action === "accept") {
    const idx = MOCK_DATA.received.findIndex((x) => x.id === id);
    if (idx !== -1) {
      const accepted = MOCK_DATA.received.splice(idx, 1)[0];
      accepted.statusText = "ĐANG TRỰC TUYẾN · VỪA KẾT BẠN";
      MOCK_DATA.friends.unshift(accepted);
      showFcToast(`✅ Đã chấp nhận lời mời của ${accepted.name}!`);
      renderPlayerList();
    }
    return;
  }

  if (action === "reject") {
    const idx = MOCK_DATA.received.findIndex((x) => x.id === id);
    if (idx !== -1) {
      const rejected = MOCK_DATA.received.splice(idx, 1)[0];
      showFcToast(`Đã từ chối lời mời kết bạn từ ${rejected.name}`);
      renderPlayerList();
    }
    return;
  }

  if (action === "cancel-sent") {
    const idx = MOCK_DATA.sent.findIndex((x) => x.id === id);
    if (idx !== -1) {
      const cancelled = MOCK_DATA.sent.splice(idx, 1)[0];
      showFcToast(`Đã thu hồi lời mời gửi tới ${cancelled.name}`);
      renderPlayerList();
    }
    return;
  }

  if (action === "add-friend") {
    const idx = MOCK_DATA.suggestions.findIndex((x) => x.id === id);
    if (idx !== -1) {
      const target = MOCK_DATA.suggestions.splice(idx, 1)[0];
      target.statusText = "VỪA GỬI LỜI MỜI · ĐANG CHỜ PHẢN HỒI";
      MOCK_DATA.sent.unshift(target);
      showFcToast(`📨 Đã gửi lời mời kết bạn tới ${target.name}`);
      renderPlayerList();
    }
    return;
  }

  if (action === "dismiss-suggestion") {
    const idx = MOCK_DATA.suggestions.findIndex((x) => x.id === id);
    if (idx !== -1) {
      MOCK_DATA.suggestions.splice(idx, 1);
      renderPlayerList();
    }
  }
}

// Khởi tạo sự kiện
function initFriendsPage() {
  // Khôi phục Chế độ Sáng / Tối đã lưu
  const savedTheme = localStorage.getItem("gc_friends_theme") || "dark";
  applyTheme(savedTheme);

  // Mở / đóng menu khi nhấn vào Avatar góc phải
  const avatarBtn = document.getElementById("btn-avatar-menu");
  const avatarDropdown = document.getElementById("avatar-dropdown-menu");

  if (avatarBtn && avatarDropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarDropdown.hidden = !avatarDropdown.hidden;
    });

    document.querySelectorAll(".fc-theme-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const selected = opt.dataset.setTheme;
        applyTheme(selected);
        avatarDropdown.hidden = true;
        showFcToast(selected === "light" ? "☀️ Đã chuyển sang Chế độ Sáng" : "🌙 Đã chuyển sang Chế độ Tối");
      });
    });

    document.addEventListener("click", (e) => {
      if (!avatarDropdown.hidden && !avatarDropdown.contains(e.target) && e.target !== avatarBtn) {
        avatarDropdown.hidden = true;
      }
    });
  }

  // Click trên 4 tab chính
  document.querySelectorAll(".fc-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Phím tắt chuyển nhanh từ thanh bar bên phải
  document.querySelectorAll("[data-quick-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.quickTab));
  });

  // Nút kính lúp ở thanh bar bên trái -> focus ô tìm kiếm
  const focusSearchBtn = document.getElementById("btn-focus-search");
  const searchInput = document.getElementById("search-player-input");
  if (focusSearchBtn && searchInput) {
    focusSearchBtn.addEventListener("click", () => searchInput.focus());
  }

  // Tìm kiếm -> tự động về trang 1
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    renderPlayerList();
  });

  // Sự kiện đóng / mở & chọn mục trên 2 Custom Dropdown (Game & Trạng thái)
  const ddGame = document.getElementById("dropdown-game");
  const btnGame = document.getElementById("btn-dropdown-game");
  const menuGame = document.getElementById("menu-dropdown-game");

  const ddStatus = document.getElementById("dropdown-status");
  const btnStatus = document.getElementById("btn-dropdown-status");
  const menuStatus = document.getElementById("menu-dropdown-status");

  function closeAllFilterDropdowns() {
    if (ddGame && menuGame && btnGame) {
      ddGame.classList.remove("is-open");
      menuGame.hidden = true;
      btnGame.setAttribute("aria-expanded", "false");
    }
    if (ddStatus && menuStatus && btnStatus) {
      ddStatus.classList.remove("is-open");
      menuStatus.hidden = true;
      btnStatus.setAttribute("aria-expanded", "false");
    }
  }

  if (btnGame && menuGame && ddGame) {
    btnGame.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = menuGame.hidden;
      closeAllFilterDropdowns();
      if (willOpen) {
        ddGame.classList.add("is-open");
        menuGame.hidden = false;
        btnGame.setAttribute("aria-expanded", "true");
      }
    });

    menuGame.addEventListener("click", (e) => {
      const item = e.target.closest("button[data-filter-game]");
      if (!item) return;
      selectedGame = item.dataset.filterGame;
      currentPage = 1;
      closeAllFilterDropdowns();
      renderPlayerList();
    });
  }

  if (btnStatus && menuStatus && ddStatus) {
    btnStatus.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = menuStatus.hidden;
      closeAllFilterDropdowns();
      if (willOpen) {
        ddStatus.classList.add("is-open");
        menuStatus.hidden = false;
        btnStatus.setAttribute("aria-expanded", "true");
      }
    });

    menuStatus.addEventListener("click", (e) => {
      const item = e.target.closest("button[data-filter-status]");
      if (!item) return;
      selectedStatus = item.dataset.filterStatus;
      currentPage = 1;
      closeAllFilterDropdowns();
      renderPlayerList();
    });
  }

  document.addEventListener("click", (e) => {
    if (ddGame && !ddGame.contains(e.target) && ddStatus && !ddStatus.contains(e.target)) {
      closeAllFilterDropdowns();
    }
  });

  // Sự kiện nút bấm trên từng người chơi
  document.getElementById("players-list-container").addEventListener("click", handlePlayerAction);
  initBlockUi();

  // Sự kiện bấm chuyển trang hoặc đổi số người / trang
  const paginationEl = document.getElementById("pagination-container");
  if (paginationEl) {
    paginationEl.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("button[data-page]");
      if (!pageBtn || pageBtn.disabled) return;
      const targetPage = Number(pageBtn.dataset.page);
      if (targetPage && targetPage !== currentPage) {
        currentPage = targetPage;
        renderPlayerList();
        const scrollEl = document.querySelector(".fc-content-scroll");
        if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    paginationEl.addEventListener("change", (e) => {
      if (e.target.id === "page-size-select") {
        pageSize = Number(e.target.value) || 6;
        currentPage = 1;
        renderPlayerList();
      }
    });
  }

  renderPlayerList();
}

initFriendsPage();

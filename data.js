// =========================================================================
// FILE DỮ LIỆU TRUNG TÂM (data.js) - ĐỒNG BỘ 100% VỚI THƯ MỤC img/
// - Chuẩn hóa tên file chữ thường: anh360.jpg & anh360_2.jpg
// - Đầy đủ 4 ngôn ngữ (VI, EN, JA, KO) & số phòng P.101, P.102, P.103, P.105, P.106
// =========================================================================

const FILE_OVERVIEW = 'anh360.jpg';
const FILE_CLOSEUP  = 'anh360_2.jpg';

const UI_TEXT = {
  vi: {
    splashSub: 'Chuyến tham quan',
    splashMain: 'TRẢI NGHIỆM<br>THỰC TẾ ẢO',
    splashRibbon: 'CAO ĐẲNG <b>CTECH</b>',
    splashBtn: 'BẮT<br>ĐẦU',
    mapBtn: 'Bản đồ',
    footer: 'Được thực hiện bởi sinh viên : Đinh Trung Nguyên-Khoa Công Nghệ Thông-Lớp TT601-K16',
    voiceLang: 'vi-VN'
  },
  en: {
    splashSub: 'Virtual Campus Tour',
    splashMain: 'VIRTUAL REALITY<br>EXPERIENCE',
    splashRibbon: 'POLYTECHNIC <b>CTECH</b>',
    splashBtn: 'START<br>TOUR',
    mapBtn: 'Map',
    footer: 'Created by student: Dinh Trung Nguyen - Faculty of Information Technology - Class TT601-K16',
    voiceLang: 'en-US'
  },
  ja: {
    splashSub: 'バーチャルキャンパスツアー',
    splashMain: 'バーチャル<br>リアリティ体験',
    splashRibbon: 'ポリテクニック <b>CTECH</b>',
    splashBtn: 'スタート',
    mapBtn: 'マップ',
    footer: '作成者：学生  Dinh Trung Nguyen - 情報技術学部 - クラス TT601-K16',
    voiceLang: 'ja-JP'
  },
  ko: {
    splashSub: '버추얼 캠퍼스 투어',
    splashMain: '가상현실 (VR)<br>캠퍼스 체험',
    splashRibbon: '폴리테크닉대학 <b>CTECH</b>',
    splashBtn: '시작<br>하기',
    mapBtn: '지도',
    footer: '제작: 학생 Dinh Trung Nguyen - 정보기술학부 - TT601-K16 반',
    voiceLang: 'ko-KR'
  }
};

// NHÃN TÒA NHÀ TRÊN ẢNH 1 (img/anh360.jpg)
const HOTSPOTS_PHOTO_1 = [
  {
    u: 0.422, vFromTop: 0.685, target: 'n01',
    label: {
      vi: '<b>N01</b><br>Hội Trường, Tuyển Sinh, CT HSSV, Văn Hóa Nhật, Thực Hành CNTT',
      en: '<b>N01</b><br>Auditorium, Admissions, Student Affairs, Japan Culture, IT Labs',
      ja: '<b>N01</b><br>講堂・入学課・学生課・日本文化室・IT実習室',
      ko: '<b>N01</b><br>강당·입학처·학생처·일본문화실·IT실습실'
    }
  },
  {
    u: 0.476, vFromTop: 0.680, target: 'n02',
    label: {
      vi: '<b>N02</b><br>Xưởng Thực Hành Ô Tô & Khu Ký Túc Xá',
      en: '<b>N02</b><br>Automotive Workshop & Student Dormitory',
      ja: '<b>N02</b><br>自動車実習工房・学生寮',
      ko: '<b>N02</b><br>자동차 실습공방 및 기숙사'
    }
  },
  {
    u: 0.532, vFromTop: 0.688, target: 'n05',
    label: {
      vi: '<b>N05</b><br>Tầng 1: Căng Tin | Tầng 2: BGH, VPK, Kế Toán, Đào Tạo | Tầng 4: Thư Viện',
      en: '<b>N05</b><br>1F: Canteen | 2F: Executive Board, Accounting, Training | 4F: Library',
      ja: '<b>N05</b><br>1F:食堂・2F:理事会/経理/教務・4F:図書館',
      ko: '<b>N05</b><br>1층:식당 | 2층:본관·회계·교무 | 4층:도서관'
    }
  },
  {
    u: 0.542, vFromTop: 0.755, target: 'n04',
    label: {
      vi: '<b>N04</b><br>Trung Tâm Ngoại Ngữ, Thực Hành Chế Biến, Phòng Học',
      en: '<b>N04</b><br>Foreign Language Center, Culinary Labs, Classrooms',
      ja: '<b>N04</b><br>外国語センター・調理実習室・講義室',
      ko: '<b>N04</b><br>외국어센터·조리실습실·강의실'
    }
  },
  {
    u: 0.600, vFromTop: 0.710, target: 'n03',
    label: {
      vi: '<b>N03</b><br>Thực Hành Sắc Đẹp & Điều Dưỡng, Phòng Họp, Phòng Học Lớn',
      en: '<b>N03</b><br>Beauty & Nursing Labs, Meeting Rooms, Large Lecture Halls',
      ja: '<b>N03</b><br>美容・看護実習室・会議室・大講義室',
      ko: '<b>N03</b><br>뷰티·간호실습실·회의실·대강의실'
    }
  },
  {
    u: 0.468, vFromTop: 0.785, target: 'square',
    label: {
      vi: '<b>Quảng Trường CTECH</b>',
      en: '<b>CTECH Square</b>',
      ja: '<b>CTECH 広場</b>',
      ko: '<b>CTECH 광장</b>'
    }
  },
  {
    u: 0.355, vFromTop: 0.775, target: 'sports',
    label: {
      vi: '<b>Khu Thể Chất & Sân bóng</b>',
      en: '<b>Sports Complex & Stadium</b>',
      ja: '<b>スポーツ施設・サッカー場</b>',
      ko: '<b>체육관 및 축구장</b>'
    }
  }
];

// NHÃN TÒA NHÀ TRÊN ẢNH 2 (img/anh360_2.jpg)
const HOTSPOTS_PHOTO_2 = [
  {
    u: 0.382, vFromTop: 0.655, target: 'n01',
    label: {
      vi: '<b>N01</b><br>Hội Trường, Tuyển Sinh, CT HSSV, Văn Hóa Nhật, Thực Hành CNTT',
      en: '<b>N01</b><br>Auditorium, Admissions, Student Affairs, Japan Culture, IT Labs',
      ja: '<b>N01</b><br>講堂・入学課・学生課・日本文化室・IT実習室',
      ko: '<b>N01</b><br>강당·입학처·학생처·일본문화실·IT실습실'
    }
  },
  {
    u: 0.490, vFromTop: 0.672, target: 'n02',
    label: {
      vi: '<b>N02</b><br>Xưởng Thực Hành Ô Tô & Khu Ký Túc Xá',
      en: '<b>N02</b><br>Automotive Workshop & Student Dormitory',
      ja: '<b>N02</b><br>自動車実習工房・学生寮',
      ko: '<b>N02</b><br>자동차 실습공방 및 기숙사'
    }
  },
  {
    u: 0.562, vFromTop: 0.655, target: 'n05',
    label: {
      vi: '<b>N05</b><br>Tầng 1: Căng Tin | Tầng 2: BGH, VPK, Kế Toán, Đào Tạo | Tầng 4: Thư Viện',
      en: '<b>N05</b><br>1F: Canteen | 2F: Executive Board, Accounting, Training | 4F: Library',
      ja: '<b>N05</b><br>1F:食堂・2F:理事会/経理/教務・4F:図書館',
      ko: '<b>N05</b><br>1층:식당 | 2층:본관·회계·교무 | 4층:도서관'
    }
  },
  {
    u: 0.618, vFromTop: 0.702, target: 'n04',
    label: {
      vi: '<b>N04</b><br>Trung Tâm Ngoại Ngữ, Thực Hành Chế Biến, Phòng Học',
      en: '<b>N04</b><br>Foreign Language Center, Culinary Labs, Classrooms',
      ja: '<b>N04</b><br>外国語センター・調理実習室・講義室',
      ko: '<b>N04</b><br>외국어센터·조리실습실·강의실'
    }
  },
  {
    u: 0.665, vFromTop: 0.635, target: 'n03',
    label: {
      vi: '<b>N03</b><br>Thực Hành Sắc Đẹp & Điều Dưỡng, Phòng Họp, Phòng Học Lớn',
      en: '<b>N03</b><br>Beauty & Nursing Labs, Meeting Rooms, Large Lecture Halls',
      ja: '<b>N03</b><br>美容・看護実習室・会議室・大講義室',
      ko: '<b>N03</b><br>뷰티·간호실습실·회의실·대강의실'
    }
  },
  {
    u: 0.492, vFromTop: 0.780, target: 'square',
    label: {
      vi: '<b>Quảng Trường CTECH</b>',
      en: '<b>CTECH Square</b>',
      ja: '<b>CTECH 広場</b>',
      ko: '<b>CTECH 광장</b>'
    }
  },
  {
    u: 0.185, vFromTop: 0.710, target: 'sports',
    label: {
      vi: '<b>Khu Thể Chất & Sân bóng</b>',
      en: '<b>Sports Complex & Stadium</b>',
      ja: '<b>スポーツ施設・サッカー場</b>',
      ko: '<b>체육관 및 축구장</b>'
    }
  }
];

const SCENES = {
  overview: {
    menu: { vi: 'Tổng Quan Trên Cao', en: 'Aerial Overview', ja: '上空からの全景', ko: '항공 전체 조망' },
    badge: { vi: 'Tổng Quan Trên Cao - Trường Cao đẳng Kỹ thuật - Công nghệ Bách Khoa', en: 'Aerial Overview - CTECH', ja: '上空からの全景 - CTECH', ko: '항공 전체 조망 - CTECH' },
    title: { vi: 'Tổng Quan Trên Cao Khuôn Viên CTECH', en: 'Aerial Overview of CTECH Campus', ja: 'CTECH キャンパスの上空全景', ko: 'CTECH 캠퍼스 항공 조망' },
    desc: {
      vi: 'Trường Cao đẳng Kỹ thuật – Công nghệ Bách Khoa (CTECH, mã trường CCG) tọa lạc tại số 60 Quốc lộ 1A, Thường Tín, Hà Nội với diện tích 22.000m² gồm 5 khối nhà hiện đại từ N01 đến N05, Quảng trường CTECH và Khu thể chất & sân bóng.',
      en: 'Polytechnic College of – Engineering and Technology (CTECH) is located at 60 National Highway 1A, Thuong Tin, Hanoi, covering 22,000m² with 5 modern building blocks from N01 to N05.',
      ja: 'ハノイ市トゥオンティン区国道1A号線60番地に位置するCTECHのメインキャンパスは、22,000平方メートルの敷地にN01からN05までの5つの校舎棟を備えています。',
      ko: '하노이시 트엉띤구 국도 1A호 60번지에 위치한 CTECH 캠퍼스는 22,000제곱미터 규모로 N01부터 N05까지 5개의 현대식 건물을 갖추고 있습니다.'
    },
    photo: FILE_OVERVIEW,
    lookAtU: 0.490, lookAtVFromTop: 0.69, scale: 0.88, next: 'campus',
    pinPos: { x: 168, y: 136 },
    hotspots: HOTSPOTS_PHOTO_1
  },

  campus: {
    menu: { vi: 'Khuôn Viên Trường', en: 'Campus Grounds', ja: 'キャンパス構内', ko: '캠퍼스 전경' },
    marzipanoId: '9-ngoi-cng-chnh',
    subItems: [
      {
        label: { vi: 'Ngoài cổng chính', en: 'Main Gate Exterior', ja: '正門外側', ko: '정문 외부' },
        marzipanoId: '9-ngoi-cng-chnh'
      },
      {
        label: { vi: 'Ngoài cổng trường (Góc rộng)', en: 'School Gate Overview', ja: '校門前（広角）', ko: '교문 앞 (광각)' },
        marzipanoId: '11-ngoi-cng-trng-'
      },
      {
        label: { vi: 'Bên trong cổng trường', en: 'Inside Main Gate', ja: '正門内側', ko: '정문 내부' },
        marzipanoId: '10-bn-trong-cng'
      },
      {
        label: { vi: 'Cổng phụ CTECH', en: 'Secondary Gate', ja: 'CTECH 通用門（副門）', ko: 'CTECH 부문' },
        marzipanoId: '60-cng-ph'
      },
      {
        label: { vi: 'Ngã ba cổng phụ gần N01', en: 'Secondary Gate Junction', ja: 'N01棟近くの副門三叉路', ko: 'N01동 근처 부문 삼거리' },
        marzipanoId: '59-ng-ba-cng-ph-gn-n01'
      },
      {
        label: { vi: 'Ngã ba giữa các tòa', en: 'Campus 3-Way Junction', ja: '校舎間の三叉路', ko: '건물 사이 삼거리' },
        marzipanoId: '24-ng-ba-gia-cc-ta'
      },
      {
        label: { vi: 'Ngã tư giữa các tòa', en: 'Campus Central Crossroads', ja: '校舎間の中央交差点', ko: '건물 사이 사거리' },
        marzipanoId: '52-ng-t-gia-cc-ta'
      },
      {
        label: { vi: 'Trước vòm hoa bên trái', en: 'Left Flower Arch', ja: '左側のフラワーアーチ前', ko: '좌측 꽃아치 앞' },
        marzipanoId: '30-trc-vm-hoa-bn-tri'
      },
      {
        label: { vi: 'Bên trong vòm hoa giữa hai tòa', en: 'Inside Flower Arch', ja: '校舎間のフラワーアーチ内', ko: '건물 사이 꽃아치 내부' },
        marzipanoId: '44-bn-trong-vm-hoa-gia-hai-ta'
      },
      {
        label: { vi: 'Trước vòm hoa bên phải', en: 'Right Flower Arch', ja: '右側のフラワーアーチ前', ko: '우측 꽃아치 앞' },
        marzipanoId: '43-trc-vm-hoa-bn-phi'
      }
    ],
    badge: { vi: 'Khuôn Viên Trường CTECH', en: 'CTECH Campus Grounds', ja: 'CTECH キャンパス構内', ko: 'CTECH 캠퍼스 전경' },
    title: { vi: 'Khuôn Viên Trường & Cổng Trường CTECH', en: 'CTECH Green Campus & Flower Garden', ja: 'CTECH キャンパスと花壇', ko: 'CTECH 캠퍼스 및 화단' },
    desc: {
      vi: 'Khuôn viên trường rộng 22.000m² được quy hoạch xanh mát với khu vòm hoa, hàng cây cảnh quan dọc trục đường nội bộ kết nối 5 khối nhà từ N01 đến N05 và Quảng trường CTECH.',
      en: 'The 22,000m² green campus features scenic flower gardens and tree-lined internal roads connecting blocks N01 through N05.',
      ja: '22,000平方メートルの緑豊かなキャンパスには美しい花壇エリアと並木道が整備されています。',
      ko: '22,000제곱미터 규모의 친환경 캠퍼스에는 아름다운 화단 구역과 가로수길이 조성되어 있습니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.495, lookAtVFromTop: 0.69, scale: 0.84, next: 'n01',
    pinPos: { x: 162, y: 118 },
    hotspots: HOTSPOTS_PHOTO_2
  },

  n01: {
    menu: {
      vi: 'N01: Hội Trường, Tuyển Sinh, CT HSSV, Văn Hóa Nhật, Thực Hành CNTT',
      en: 'N01: Auditorium, Admissions, Student Affairs, Japan Culture, IT Labs',
      ja: 'N01: 講堂・入学課・学生課・日本文化室・IT実習室',
      ko: 'N01: 강당·입학처·학생처·일본문화실·IT실습실'
    },
    marzipanoId: '2-bn-ngoi-n01',
    subItems: [
      {
        label: { vi: 'Bên ngoài sảnh N01', en: 'Outside Building N01', ja: 'N01棟ロビー外側', ko: 'N01동 로비 외부' },
        marzipanoId: '2-bn-ngoi-n01'
      },
      {
        label: { vi: 'Sảnh chính tòa N01', en: 'N01 Main Lobby', ja: 'N01棟メインロビー', ko: 'N01동 메인 로비' },
        marzipanoId: '0-snh-n01'
      },
      {
        label: { vi: 'Phòng Công tác Học sinh - Sinh viên', en: 'Student Affairs Office (CT HSSV)', ja: '学生支援課（学生課）', ko: '학생지원처 (학생과)' },
        marzipanoId: '3-phng-cng-tc-tuyn-sinh'
      },
      {
        label: { vi: 'Hội trường lớn N01', en: 'N01 Grand Auditorium', ja: 'N01棟 大講堂', ko: 'N01동 대강당' },
        marzipanoId: '1-hi-trng-n01'
      },
      {
        label: { vi: 'Phòng thực hành máy (Khoa CNTT)', en: 'IT Computer Lab', ja: 'IT学部 コンピュータ実習室', ko: 'IT학부 컴퓨터 실습실' },
        marzipanoId: '4-phng-thc-hnh-my'
      },
      {
        label: { vi: 'Phòng thực hành CNTT (Ca tối)', en: 'Evening IT Practice Lab', ja: 'IT実習室（夜間）', ko: 'IT 실습실 (야간)' },
        marzipanoId: '5-phng-thc-hng-v-m'
      },
      {
        label: { vi: 'Phòng Tiếng Nhật lớn', en: 'Large Japanese Classroom', ja: '日本語大教室（日本文化室）', ko: '일본어 대강의실' },
        marzipanoId: '6-phng-ting-nht-ln'
      },
      {
        label: { vi: 'Phòng Tiếng Nhật bé', en: 'Small Japanese Classroom', ja: '日本語小教室', ko: '일본어 소강의실' },
        marzipanoId: '7-phng-ting-nht-b'
      },
      {
        label: { vi: 'Trước mặt tòa N01', en: 'Front of Building N01', ja: 'N01棟正面', ko: 'N01동 정면' },
        marzipanoId: '8-trc-mt-ton-n01'
      },
      {
        label: { vi: 'Mặt bên trái tòa N01', en: 'Left Side of Building N01', ja: 'N01棟左側面', ko: 'N01동 좌측면' },
        marzipanoId: '12-mt-bn-tri-ton-n01'
      }
    ],
    badge: { vi: 'Bên ngoài N01 - Cao đẳng CTECH', en: 'N01: Admissions, Student Affairs, IT Labs', ja: 'N01: 講堂・入学課・学生課・IT実習室', ko: 'N01: 강당·입학처·학생처·IT실습실' },
    title: { vi: 'Bên ngoài N01 - Tòa N01 (Hội Trường, Tuyển Sinh, CT HSSV, Văn Hóa Nhật, CNTT)', en: 'Block N01: Admissions, Student Affairs, Japan Culture & IT Labs', ja: 'N01棟：講堂・入学課・学生課・日本文化室・IT実習室', ko: 'N01동: 강당·입학처·학생처·일본문화실·IT실습실' },
    desc: {
      vi: 'Tòa nhà N01 nằm ngay phía đầu cổng trường đi vào. Đây là nơi bố trí Hội trường lớn, Phòng Tuyển sinh, Phòng Công tác Học sinh - Sinh viên, không gian Văn hóa Nhật Bản, cùng hệ thống các phòng học lý thuyết và Phòng thực hành Khoa Công nghệ thông tin.',
      en: 'Located right at the main gate entrance, Building N01 houses the Grand Auditorium, Admissions Office, Student Affairs Office, Japanese Cultural Space, Classrooms, and IT Faculty Practice Labs.',
      ja: '正門すぐ左手に位置するN01棟には、大講堂、入学相談課、学生支援課、日本文化室、講義室、および情報技術（IT）学部の実習室があります。',
      ko: '정문 입구에 위치한 N01동에는 대강당, 입학처, 학생지원처, 일본문화실, 이론 강의실 및 정보기술(IT) 학부 실습실이 자리하고 있습니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.385, lookAtVFromTop: 0.655, scale: 0.52, next: 'n02',
    pinPos: { x: 125, y: 118 },
    hotspots: HOTSPOTS_PHOTO_2
  },

  n02: {
    menu: {
      vi: 'N02: Xưởng Thực Hành Ô Tô & Khu Ký Túc Xá (Mặt sau Quảng Trường)',
      en: 'N02: Automotive Workshop & Dormitory (Rear faces Square)',
      ja: 'N02: 自動車実習工房・学生寮（裏手は広場）',
      ko: 'N02: 자동차 실습공방 및 기숙사 (후면 광장 연결)'
    },
    marzipanoId: '13-mt-chnh-xng--t',
    subItems: [
      {
        label: { vi: 'Mặt chính Xưởng thực hành Ô tô', en: 'Automotive Workshop Entrance', ja: '自動車実習工房 正面入口', ko: '자동차 실습공방 정면 입구' },
        marzipanoId: '13-mt-chnh-xng--t'
      },
      {
        label: { vi: 'Bên trong Xưởng thực hành Ô tô', en: 'Inside Automotive Workshop', ja: '自動車実習工房 内部', ko: '자동차 실습공방 내부' },
        marzipanoId: '14-bn-trong-xng--t'
      },
      {
        label: { vi: 'Tầng 2 tòa N02', en: '2nd Floor Building N02', ja: 'N02棟 2階フロア', ko: 'N02동 2층' },
        marzipanoId: '16-tng-hai-ta-n02'
      },
      {
        label: { vi: 'Trước cửa Phòng thực hành Điện (Tầng 2)', en: 'Electrical Lab Corridor (2F)', ja: '電気実習室前（2階）', ko: '2층 전기실습실 앞' },
        marzipanoId: '15-tng-hai-ta-n02-trc-ca-phng-in'
      },
      {
        label: { vi: 'Bên trong Phòng thực hành Điện N02', en: 'Inside Electrical Lab N02', ja: 'N02棟 電気実習室内部', ko: 'N02동 전기실습실 내부' },
        marzipanoId: '17-bn-trong-phng-in-n02'
      },
      {
        label: { vi: 'Lối vào Sân cầu lông N02', en: 'Badminton Court Entrance', ja: 'N02棟 バドミントンコート入口', ko: 'N02동 배드민턴장 입구' },
        marzipanoId: '18-trc-ca-i-vo-sn-cu-lng-n02'
      },
      {
        label: { vi: 'Sân cầu lông trong nhà N02', en: 'Indoor Badminton Court N02', ja: 'N02棟 屋内バドミントンコート', ko: 'N02동 실내 배드민턴장' },
        marzipanoId: '19-sn-cu-lng-n02'
      },
      {
        label: { vi: 'Tầng 3 tòa N02 - Khu Ký túc xá', en: '3rd Floor Student Dormitory', ja: 'N02棟 3階 学生寮エリア', ko: 'N02동 3층 학생 기숙사' },
        marzipanoId: '20-tng-ba-ta-n02-k-tc-x'
      },
      {
        label: { vi: 'Hành lang tầng 3 Ký túc xá N02', en: '3rd Floor Dormitory Corridor', ja: 'N02棟 3階 学生寮廊下', ko: 'N02동 3층 기숙사 복도' },
        marzipanoId: '21-hanh-lang-tng-ba-ton-n02'
      },
      {
        label: { vi: 'Bên trong Phòng ở Ký túc xá', en: 'Inside Student Dormitory Room', ja: '学生寮 居室内部', ko: '학생 기숙사 호실 내부' },
        marzipanoId: '22-bn-trong-phng-k-tc'
      },
      {
        label: { vi: 'Đường nội bộ quanh tòa N02', en: 'Road Around Building N02', ja: 'N02棟周辺の構内道路', ko: 'N02동 주변 내부 도로' },
        marzipanoId: '23-ng-i-quay-n02'
      }
    ],
    badge: { vi: 'N02: Xưởng Thực Hành Ô Tô & Khu Ký Túc Xá', en: 'N02: Automotive Workshop & Dormitory', ja: 'N02: 自動車実習工房・学生寮', ko: 'N02: 자동차 실습공방 및 기숙사' },
    title: { vi: 'Tòa N02: Xưởng Thực Hành Ô Tô, Ký Túc Xá & Mặt Sau Giáp Quảng Trường', en: 'Block N02: Automotive Workshop & Student Dormitory', ja: 'N02棟：自動車実習工房・学生寮', ko: 'N02동: 자동차 실습공방 및 학생 기숙사' },
    desc: {
      vi: 'Tòa nhà N02 nổi bật ở trung tâm trường với hai mái sơn hình Cờ Đỏ Sao Vàng. Nơi đây tích hợp Xưởng thực hành Công nghệ Ô tô, Phòng thực hành Điện, Sân cầu lông và Khu Ký túc xá sinh viên nội trú. Một mặt phía sau của tòa N02 hướng thẳng ra Quảng trường CTECH.',
      en: 'Standing at the center with its Vietnamese Flag roofs, Building N02 houses the Automotive Engineering Workshop and Student Dormitory, with its rear facade opening directly onto CTECH Square.',
      ja: '中央に位置するN02棟には、最新の自動車工学実習工房と学生寮が備わっており、建物の裏手はCTECH広場に直結しています。',
      ko: '중앙에 위치한 N02동은 첨단 자동차 실습공방과 학생 기숙사로 구성되어 있으며, 건물 후면은 CTECH 광장과 직접 연결됩니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.490, lookAtVFromTop: 0.672, scale: 0.53, next: 'n03',
    pinPos: { x: 150, y: 118 },
    hotspots: HOTSPOTS_PHOTO_2
  },

  n03: {
    menu: {
      vi: 'N03: Thực Hành Sắc Đẹp & Điều Dưỡng, Phòng Họp, Phòng Học Lớn',
      en: 'N03: Beauty & Nursing Labs, Meeting Rooms, Large Classrooms',
      ja: 'N03: 美容・看護実習室・会議室・大講義室',
      ko: 'N03: 뷰티·간호실습실·회의실·대강의실'
    },
    marzipanoId: '35-chnh-gia-ta-n03',
    subItems: [
      {
        label: { vi: 'Sảnh chính giữa tòa N03', en: 'Building N03 Central Lobby', ja: 'N03棟 中央ロビー', ko: 'N03동 중앙 로비' },
        marzipanoId: '35-chnh-gia-ta-n03'
      },
      {
        label: { vi: 'Phòng thực hành Điều dưỡng (P.101)', en: 'Nursing Practice Lab (Room 101)', ja: '看護実習室（101号室）', ko: '간호 실습실 (101호)' },
        marzipanoId: '36-phng-thc-hnh-iu-dng'
      },
      {
        label: { vi: 'Phòng thực hành Sắc đẹp - Trang điểm (P.102)', en: 'Beauty & Makeup Lab (Room 102)', ja: '美容・メイク実習室（102号室）', ko: '뷰티·메이크업 실습실 (102호)' },
        marzipanoId: '37-phng-thc-hnh-sc-p-trang-im'
      },
      {
        label: { vi: 'Phòng thực hành Điều trị da mặt - Spa (P.103)', en: 'Facial Skincare Lab (Room 103)', ja: 'フェイシャル実習室（103号室）', ko: '피부관리 실습실 (103호)' },
        marzipanoId: '38-phng-thc-hnh-sc-p-iu-tr-da-mt'
      },
      {
        label: { vi: 'Phòng trưng bày Thiết kế đồ họa (P.105)', en: 'Graphic Design Showroom (Room 105)', ja: 'デザイン展示室（105号室）', ko: '그래픽디자인 전시실 (105호)' },
        marzipanoId: '39-phng-chng-by-ca-thit-k--ha'
      },
      {
        label: { vi: 'Sảnh tầng 2 tòa N03', en: '2nd Floor Building N03', ja: 'N03棟 2階ロビー', ko: 'N03동 2층 로비' },
        marzipanoId: '40-tng-hai-ta-n03'
      },
      {
        label: { vi: 'Phòng học lớn tòa N03', en: 'Building N03 Lecture Classroom', ja: 'N03棟 大講義室', ko: 'N03동 대강의실' },
        marzipanoId: '42-phng-hc-ta-n03'
      },
      {
        label: { vi: 'Phía trước tòa N03', en: 'Front of Building N03', ja: 'N03棟 正面', ko: 'N03동 정면' },
        marzipanoId: '34-trc-ta-n03'
      },
      {
        label: { vi: 'Khuôn viên phía sau tòa N03 (Góc 1)', en: 'Behind Building N03 (View 1)', ja: 'N03棟 裏手エリア（視点1）', ko: 'N03동 후면 구역 (뷰 1)' },
        marzipanoId: '32-sau-ta-n03'
      },
      {
        label: { vi: 'Khuôn viên phía sau tòa N03 (Góc 2)', en: 'Behind Building N03 (View 2)', ja: 'N03棟 裏手エリア（視点2）', ko: 'N03동 후면 구역 (뷰 2)' },
        marzipanoId: '33-sau-ta-n03-s-2'
      },
      {
        label: { vi: 'Lối đi bên hông gần tòa N03', en: 'Side Walkway Near N03', ja: 'N03棟横の通路', ko: 'N03동 측면 산책로' },
        marzipanoId: '31-trc-bi-rc-gn-n03'
      }
    ],
    badge: { vi: 'N03: Thực Hành Sắc Đẹp & Điều Dưỡng, Phòng Họp, Phòng Học Lớn', en: 'N03: Beauty & Nursing Labs, Large Classrooms', ja: 'N03: 美容・看護実習室・大講義室', ko: 'N03: 뷰티·간호실습실·대강의실' },
    title: { vi: 'Tòa N03: Chuyên Phòng Thực Hành Sắc Đẹp, Điều Dưỡng, Phòng Họp & Phòng Học Lớn', en: 'Block N03: Beauty Care, Nursing Labs, Meeting Rooms & Large Halls', ja: 'N03棟：美容・看護実習室・会議室・大講義室', ko: 'N03동: 뷰티·간호실습실·회의실·대강의실' },
    desc: {
      vi: 'Tòa nhà N03 chuyên biệt cho khối thực hành Chăm sóc sức khỏe & Thẩm mỹ bao gồm Phòng thực hành Điều dưỡng (P.101), Phòng thực hành Chăm sóc sắc đẹp - Trang điểm (P.102), Phòng thực hành Điều trị da mặt (P.103), Phòng trưng bày Thiết kế đồ họa (P.105) và hệ thống Phòng học lớn.',
      en: 'Building N03 specializes in Healthcare training with dedicated Beauty Care and Nursing Practice Labs, alongside Meeting Rooms and Large Lecture Classrooms.',
      ja: 'N03棟はヘルスケア分野の実習に特化しており、美容実習室、看護実習室、会議室、および大講義室が配置されています。',
      ko: 'N03동은 헬스케어 실습 전용 공간으로 뷰티케어 실습실, 간호 실습실, 회의실 및 대형 강의실이 갖추어져 있습니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.665, lookAtVFromTop: 0.635, scale: 0.52, next: 'n04',
    pinPos: { x: 228, y: 122 },
    hotspots: HOTSPOTS_PHOTO_2
  },

  n04: {
    menu: {
      vi: 'N04: Trung Tâm Ngoại Ngữ, Thực Hành Chế Biến, Phòng Học',
      en: 'N04: Foreign Language Center, Culinary Labs, Classrooms',
      ja: 'N04: 外国語センター・調理実習室・講義室',
      ko: 'N04: 외국어센터·조리실습실·강의실'
    },
    marzipanoId: '46-chnh-gia-ta-n04',
    subItems: [
      {
        label: { vi: 'Trước mặt tòa N04', en: 'Front of Building N04', ja: 'N04棟 正面', ko: 'N04동 정면' },
        marzipanoId: '45-trc-mt-ta-n04'
      },
      {
        label: { vi: 'Sảnh chính giữa tòa N04', en: 'Building N04 Central Hall', ja: 'N04棟 中央ホール', ko: 'N04동 중앙 홀' },
        marzipanoId: '46-chnh-gia-ta-n04'
      },
      {
        label: { vi: 'Trung tâm Ngoại ngữ (Tầng 2 N04)', en: 'Foreign Language Center (2F)', ja: '外国語センター（N04棟 2階）', ko: '외국어센터 (N04동 2층)' },
        marzipanoId: '49-trung-tm-ngoi-ng-tng-2-n04'
      },
      {
        label: { vi: 'Phòng học Tiếng Hán N04', en: 'Chinese Language Classroom N04', ja: 'N04棟 中国語教室', ko: 'N04동 중국어 강의실' },
        marzipanoId: '41-phng-hc-ting-hn-ta-n04'
      },
      {
        label: { vi: 'Phòng thực hành Chế biến món ăn (P.106)', en: 'Culinary Arts Practice Lab (Room 106)', ja: '調理技術実習室（106号室）', ko: '조리기술 실습실 (106호)' },
        marzipanoId: '50-phng-thc-hnh-ch-bin'
      },
      {
        label: { vi: 'Phòng thực hành Thiết kế đồ họa N04', en: 'Graphic Design Lab N04', ja: 'N04棟 グラフィックデザイン実習室', ko: 'N04동 그래픽디자인 실습실' },
        marzipanoId: '48-phng-thc-hnh-thit-k--ha-n04'
      },
      {
        label: { vi: 'Phòng Y tế N04 (P.101)', en: 'Campus Medical Clinic N04 (Room 101)', ja: 'N04棟 医務室（101号室）', ko: 'N04동 보건실 (101호)' },
        marzipanoId: '47-phng-y-t-n04'
      }
    ],
    badge: { vi: 'N04: Trung Tâm Ngoại Ngữ, Thực Hành Chế Biến, Phòng Học', en: 'N04: Language Center, Culinary Labs, Classrooms', ja: 'N04: 外国語センター・調理実習室', ko: 'N04: 외국어센터·조리실습실' },
    title: { vi: 'Tòa N04: Trung Tâm Ngoại Ngữ, Phòng Thực Hành Chế Biến Món Ăn (P.106) & Phòng Y Tế (P.101)', en: 'Block N04: Foreign Language Center, Culinary Labs & Classrooms', ja: 'N04棟：外国語センター・調理実習室・講義室', ko: 'N04동: 외국어센터·조리실습실·강의실' },
    desc: {
      vi: 'Tòa nhà N04 là nơi đặt Trung tâm Ngoại ngữ CTECH, Phòng học Tiếng Hán, Phòng thực hành Kỹ thuật Chế biến món ăn (Phòng 106) đạt chuẩn nhà hàng - khách sạn, Phòng thực hành Đồ họa và Phòng Y tế chăm sóc sức khỏe (Phòng 101).',
      en: 'Building N04 houses the Foreign Language Center, standard Culinary Arts Practice Kitchens, Classrooms, and the Campus Medical Clinic.',
      ja: 'N04棟には外国語センター、ホテル仕様の調理技術実習室、一般講義室、および医務室が整備されています。',
      ko: 'N04동에는 외국어센터, 호텔급 조리기술 실습실, 일반 강의실 및 보건실이 자리하고 있습니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.618, lookAtVFromTop: 0.702, scale: 0.52, next: 'n05',
    pinPos: { x: 192, y: 138 },
    hotspots: HOTSPOTS_PHOTO_2
  },

  n05: {
    menu: {
      vi: 'N05: Tầng 1 Căng Tin | Tầng 2 Hiệu Bộ, BGH, VPK, Kế Toán, Đào Tạo | Tầng 4 Thư Viện',
      en: 'N05: 1F Canteen | 2F Admin, Executive Board, Accounting, Training | 4F Library',
      ja: 'N05: 1F食堂・2F本館/理事会/経理/教務・4F図書館',
      ko: 'N05: 1층 식당 | 2층 본관·회계·교무 | 4층 도서관'
    },
    marzipanoId: '25-trc-ca-ta-n05-cng-tin',
    subItems: [
      {
        label: { vi: 'Trước cửa tòa N05 & Căng tin', en: 'Building N05 Entrance', ja: 'N05棟・学生食堂 入口前', ko: 'N05동 및 학생식당 입구 앞' },
        marzipanoId: '25-trc-ca-ta-n05-cng-tin'
      },
      {
        label: { vi: 'Tầng 1: Căng tin sinh viên N05', en: '1st Floor: Student Canteen', ja: '1階：N05棟 学生食堂', ko: '1층: N05동 학생식당' },
        marzipanoId: '26-cng-tin-n05'
      },
      {
        label: { vi: 'Tầng 2: Văn phòng Giáo viên, Kế toán, Đào tạo', en: '2nd Floor: Faculty, Accounting & Training Offices', ja: '2階：教員室・経理課・教務課', ko: '2층: 교무실·회계과·교육과' },
        marzipanoId: '27-phng-gio-vin-k-ton-o-to'
      },
      {
        label: { vi: 'Tầng 4: Thư viện CTECH N05', en: '4th Floor: CTECH Library', ja: '4階：CTECH 中央図書館', ko: '4층: CTECH 중앙도서관' },
        marzipanoId: '28-th-vin-n05'
      },
      {
        label: { vi: 'Bên trong Phòng họp Thư viện', en: 'Inside Library Meeting Room', ja: '図書館 会議室内部', ko: '도서관 회의실 내부' },
        marzipanoId: '29-trong-phng-hp-th-vin'
      }
    ],
    badge: { vi: 'N05: Tầng 1 Căng Tin | Tầng 2 BGH, VPK, Kế Toán, Đào Tạo | Tầng 4 Thư Viện', en: 'N05: 1F Canteen | 2F Admin & Accounting | 4F Library', ja: 'N05: 1F食堂・2F本館/経理・4F図書館', ko: 'N05: 1층 식당·2층 본관/회계·4층 도서관' },
    title: { vi: 'Tòa N05: Tầng 1 Căng Tin, Tầng 2 Hiệu Bộ (BGH, VPK, Kế Toán, Đào Tạo), Tầng 4 Thư Viện', en: 'Block N05: Canteen (1F), Executive & Admin Offices (2F), Library (4F)', ja: 'N05棟：1階食堂・2階本部（理事会・経理・教務）・4階図書館', ko: 'N05동: 1층 식당·2층 대학본부(이사회·회계·교무)·4층 도서관' },
    desc: {
      vi: 'Tòa nhà N05 được bố trí chức năng theo từng tầng: Tầng 1 là Căng tin phục vụ ăn uống cho sinh viên; Tầng 2 là khu Văn phòng Hiệu bộ bao gồm Ban Giám hiệu, Văn phòng Khoa, Phòng Kế toán và Phòng Đào tạo; Tầng 4 là Thư viện trung tâm và Phòng họp.',
      en: 'Building N05 features the Student Canteen on the 1st floor; the Executive Board, Faculty Offices, Accounting, and Academic Training Department on the 2nd floor; and the Central Library on the 4th floor.',
      ja: 'N05棟は1階に学生食堂、2階に本部事務局（理事会、各学部事務室、経理課、教務課）、4階に中央図書館が配置されています。',
      ko: 'N05동은 1층 학생식당, 2층 대학본부(이사회, 학부사무실, 회계과, 교무과), 4층 중앙도서관으로 구성되어 있습니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.562, lookAtVFromTop: 0.655, scale: 0.52, next: 'square',
    pinPos: { x: 185, y: 106 },
    hotspots: HOTSPOTS_PHOTO_2
  },

  square: {
    menu: { vi: 'Quảng Trường CTECH', en: 'CTECH Square', ja: 'CTECH 広場', ko: 'CTECH 광장' },
    marzipanoId: '54-gia-sn-ctech',
    subItems: [
      {
        label: { vi: 'Giữa sân lớn CTECH', en: 'Middle of CTECH Courtyard', ja: 'CTECH 中央広場（コートヤード）', ko: 'CTECH 중앙 광장 마당' },
        marzipanoId: '54-gia-sn-ctech'
      },
      {
        label: { vi: 'Trung tâm Quảng trường Hoa Sen CTECH', en: 'CTECH Lotus Square Center', ja: 'CTECH ロータス広場中央', ko: 'CTECH 연꽃 광장 중앙' },
        marzipanoId: '55-qung-trng-ctech'
      },
      {
        label: { vi: 'Ngã ba gần Quảng trường CTECH', en: 'Junction Near CTECH Square', ja: 'CTECH 広場近くの三叉路', ko: 'CTECH 광장 근처 삼거리' },
        marzipanoId: '51-ng-ba-gn-qung-trng-ctech'
      }
    ],
    badge: { vi: 'Giữa sân ctech - Cao đẳng CTECH', en: 'CTECH Central Square', ja: 'CTECH ロータス広場', ko: 'CTECH 중앙 광장' },
    title: { vi: 'Giữa sân ctech', en: 'CTECH Central Lotus Square', ja: 'CTECH ロータス学生広場', ko: 'CTECH 연꽃 학생광장' },
    desc: {
      vi: 'Quảng trường CTECH nằm ngay phía mặt sau của tòa nhà N02 với biểu tượng Hoa Sen CTECH ở chính giữa sân tròn, là nơi giao lưu và tổ chức các sự kiện lớn của sinh viên.',
      en: 'Located directly behind Building N02, CTECH Square features the iconic CTECH Lotus emblem and serves as the main outdoor event venue.',
      ja: 'N02棟の裏手に広がるCTECH広場は、巨大なロータスの紋章を備え、学生たちの交流の中心地となっています。',
      ko: 'N02동 후면에 자리한 CTECH 광장은 대형 연꽃 로고가 새겨진 원형 광장으로 학생 문화행사의 중심 공간입니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.492, lookAtVFromTop: 0.74, scale: 0.74, next: 'sports',
    pinPos: { x: 150, y: 152 },
    hotspots: HOTSPOTS_PHOTO_2
  },

  sports: {
    menu: { vi: 'Khu Thể Chất & Sân bóng', en: 'Sports Complex & Stadium', ja: 'スポーツ施設・サッカー場', ko: '체육관 및 축구장' },
    marzipanoId: '58-sn-bng',
    subItems: [
      {
        label: { vi: 'Sân bóng đá cỏ nhân tạo CTECH', en: 'Artificial Turf Football Pitch', ja: 'CTECH 人工芝サッカー場', ko: 'CTECH 인조잔디 축구장' },
        marzipanoId: '58-sn-bng'
      },
      {
        label: { vi: 'Vị trí đứng xem đá bóng', en: 'Football Viewing Area', ja: 'サッカー観戦エリア', ko: '축구 관람 구역' },
        marzipanoId: '57-v-tr--xem--bng'
      },
      {
        label: { vi: 'Đường vào sân bóng', en: 'Entrance to Football Pitch', ja: 'サッカー場入口', ko: '축구장 입구' },
        marzipanoId: '61-ng-vo-sn-bng'
      },
      {
        label: { vi: 'Đoạn đường dẫn vào sân bóng', en: 'Walkway to Sports Complex', ja: 'サッカー場への連絡通路', ko: '축구장 진입로' },
        marzipanoId: '56-on-ng-vo-sn-bng'
      },
      {
        label: { vi: 'Đoạn đường gần sân bóng', en: 'Road Near Football Pitch', ja: 'サッカー場周辺の道路', ko: '축구장 주변 도로' },
        marzipanoId: '53-on-ng-gn-sn-bng'
      }
    ],
    badge: { vi: 'Khu Thể Chất & Sân bóng CTECH', en: 'CTECH Sports Complex & Stadium', ja: 'CTECH 体育施設・サッカー場', ko: 'CTECH 체육관 및 축구장' },
    title: { vi: 'Khu Thể Chất & Sân Bóng Đá CTECH', en: 'CTECH Sports Complex & Football Pitch', ja: 'CTECH スポーツ施設・サッカー場', ko: 'CTECH 체육 시설 및 축구장' },
    desc: {
      vi: 'Khu thể chất và sân bóng đá cỏ nhân tạo nằm ở phía bên trái khuôn viên trường, phục vụ môn học Giáo dục thể chất và các giải đấu thể thao sôi nổi của sinh viên CTECH.',
      en: 'Located on the left side of the campus, the sports complex and artificial turf football pitch host physical education classes and student tournaments.',
      ja: 'キャンパス左側に位置する人工芝サッカー場とスポーツエリアでは、体育の授業やスポーツ大会が行われています。',
      ko: '캠퍼스 좌측에 위치한 인조잔디 축구장과 체육 시설은 체육 수업과 학생 스포츠 경기가 열리는 공간입니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.210, lookAtVFromTop: 0.71, scale: 0.60, next: 'model3d',
    pinPos: { x: 75, y: 176 },
    hotspots: HOTSPOTS_PHOTO_2
  },

 model3d: {
    menu: { vi: 'Kích Hoạt Kính Thực Tế Ảo 3D', en: 'Activate 3D VR Mode', ja: '3D VRモード起動', ko: '3D VR 모드 활성화' },
    badge: { vi: 'Chế độ Kính Thực Tế Ảo 3D', en: '3D VR Mode', ja: '3D VRモード', ko: '3D VR 모드' },
    title: { vi: 'Trải Nghiệm Kính Thực Tế Ảo VR 3D CTECH', en: 'CTECH 3D VR Experience', ja: 'CTECH 3D VR体験', ko: 'CTECH 3D VR 체험' },
    desc: {
      vi: 'Chế độ chia đôi màn hình lập thể 2 mắt kết hợp cảm biến xoay đầu 360 độ dành cho kính thực tế ảo.',
      en: 'Stereoscopic side-by-side 3D mode with 360-degree gyroscope head tracking for VR headsets.',
      ja: 'VRゴーグル向けの360度ジャイロスコープ対応3Dステレオモードです。',
      ko: 'VR 헤드셋을 위한 360도 자이로스코프 지원 입체 3D 모드입니다.'
    },
    photo: FILE_CLOSEUP,
    lookAtU: 0.490, lookAtVFromTop: 0.69, scale: 0.85, next: 'overview',
    pinPos: { x: 168, y: 136 },
    hotspots: HOTSPOTS_PHOTO_2
  }
};
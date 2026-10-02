/**
 * Vietnam Administrative Divisions Data (Provinces -> Districts -> Wards)
 * Standardized data for e-commerce checkout and address management.
 */

export const VIETNAM_PROVINCES = [
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        id: 'q1',
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Tân Định', 'Phường Phạm Ngũ Lão', 'Phường Nguyễn Cư Trinh', 'Phường Cầu Ông Lãnh']
      },
      {
        id: 'q3',
        name: 'Quận 3',
        wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 11', 'Phường 14']
      },
      {
        id: 'q7',
        name: 'Quận 7',
        wards: ['Phường Tân Phong (Phú Mỹ Hưng)', 'Phường Tân Phú', 'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây', 'Phường Tân Kiểng', 'Phường Tân Quy']
      },
      {
        id: 'binh_thanh',
        name: 'Quận Bình Thạnh',
        wards: ['Phường 22 (Landmark 81)', 'Phường 19', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28', 'Phường 15', 'Phường 17']
      },
      {
        id: 'tan_binh',
        name: 'Quận Tân Bình',
        wards: ['Phường 2 (Sân bay Tân Sơn Nhất)', 'Phường 4', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        id: 'thu_duc',
        name: 'TP. Thủ Đức',
        wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường Bình An', 'Phường Linh Trung', 'Phường Hiệp Phú', 'Phường Tăng Nhơn Phú A', 'Phường Thủ Thiêm']
      },
      {
        id: 'phu_nhuan',
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 7', 'Phường 9', 'Phường 10', 'Phường 15']
      },
      {
        id: 'q10',
        name: 'Quận 10',
        wards: ['Phường 12', 'Phường 14', 'Phường 15', 'Phường 10', 'Phường 11']
      }
    ]
  },
  {
    id: 'hn',
    name: 'Hà Nội',
    districts: [
      {
        id: 'hoan_kiem',
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Tràng Tiền', 'Phường Hàng Bạc', 'Phường Hàng Buồm', 'Phường Hàng Đào', 'Phường Lý Thái Tổ', 'Phường Phan Chu Trinh']
      },
      {
        id: 'ba_dinh',
        name: 'Quận Ba Đình',
        wards: ['Phường Điện Biên', 'Phường Đội Cấn', 'Phường Liễu Giai', 'Phường Kim Mã', 'Phường Giảng Võ', 'Phường Quán Thánh']
      },
      {
        id: 'cau_giay',
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Yên Hòa', 'Phường Trung Hòa']
      },
      {
        id: 'dong_da',
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Hàng Bột', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Ô Chợ Dừa', 'Phường Quang Trung']
      },
      {
        id: 'hai_ba_trung',
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Bách Khoa', 'Phường Bạch Mai', 'Phường Minh Khai', 'Phường Lê Đại Hành', 'Phường Trương Định']
      },
      {
        id: 'nam_tu_liem',
        name: 'Quận Nam Từ Liêm',
        wards: ['Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Mễ Trì', 'Phường Cầu Diễn', 'Phường Trung Văn']
      },
      {
        id: 'tay_ho',
        name: 'Quận Tây Hồ',
        wards: ['Phường Quảng An', 'Phường Xuân La', 'Phường Yên Phụ', 'Phường Bưởi', 'Phường Nhật Tân']
      }
    ]
  },
  {
    id: 'dn',
    name: 'Đà Nẵng',
    districts: [
      {
        id: 'hai_chau',
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Hòa Thuận Đông']
      },
      {
        id: 'thanh_khe',
        name: 'Quận Thanh Khê',
        wards: ['Phường Vĩnh Trung', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Chính Gián', 'Phường Tam Thuận']
      },
      {
        id: 'son_tra',
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Phước Mỹ', 'Phường Mân Thái']
      },
      {
        id: 'ngu_hanh_son',
        name: 'Quận Ngũ Hành Sơn',
        wards: ['Phường Mỹ An', 'Phường Khuê Mỹ', 'Phường Hòa Quý', 'Phường Hòa Hải']
      }
    ]
  },
  {
    id: 'hp',
    name: 'Hải Phòng',
    districts: [
      {
        id: 'hong_bang',
        name: 'Quận Hồng Bàng',
        wards: ['Phường Minh Khai', 'Phường Hoàng Văn Thụ', 'Phường Phan Bội Châu', 'Phường Quán Toan']
      },
      {
        id: 'ngo_quyen',
        name: 'Quận Ngô Quyền',
        wards: ['Phường Cầu Đất', 'Phường Lạch Tray', 'Phường Lê Lợi', 'Phường Máy Tơ']
      },
      {
        id: 'le_chan',
        name: 'Quận Lê Chân',
        wards: ['Phường An Biên', 'Phường An Dương', 'Phường Cát Dài', 'Phường Kênh Dương']
      }
    ]
  },
  {
    id: 'ct',
    name: 'Cần Thơ',
    districts: [
      {
        id: 'ninh_kieu',
        name: 'Quận Ninh Kiều',
        wards: ['Phường Tân An', 'Phường An Cư', 'Phường An Hòa', 'Phường Xuân Khánh', 'Phường Hưng Lợi']
      },
      {
        id: 'binh_thuy',
        name: 'Quận Bình Thủy',
        wards: ['Phường Bình Thủy', 'Phường Trà An', 'Phường Trà Nóc', 'Phường An Thới']
      },
      {
        id: 'cai_rang',
        name: 'Quận Cái Răng',
        wards: ['Phường Lê Bình', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Ba Láng']
      }
    ]
  },
  {
    id: 'bd',
    name: 'Bình Dương',
    districts: [
      {
        id: 'thu_dau_mot',
        name: 'TP. Thủ Dầu Một',
        wards: ['Phường Phú Cường', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa', 'Phường Định Hòa', 'Phường Phú Lợi']
      },
      {
        id: 'thuan_an',
        name: 'TP. Thuận An',
        wards: ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Bình Hòa', 'Phường Thuận Giao']
      },
      {
        id: 'di_an',
        name: 'TP. Dĩ An',
        wards: ['Phường Dĩ An', 'Phường An Bình', 'Phường Đông Hòa', 'Phường Tân Đông Hiệp']
      }
    ]
  },
  {
    id: 'dong_nai',
    name: 'Đồng Nai',
    districts: [
      {
        id: 'bien_hoa',
        name: 'TP. Biên Hòa',
        wards: ['Phường Quyết Thắng', 'Phường Trung Dũng', 'Phường Tân Mai', 'Phường Tân Phong', 'Phường Thống Nhất']
      },
      {
        id: 'long_khanh',
        name: 'TP. Long Khánh',
        wards: ['Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Hòa', 'Phường Xuân Trung']
      }
    ]
  },
  {
    id: 'hue',
    name: 'Thừa Thiên Huế',
    districts: [
      {
        id: 'tp_hue',
        name: 'TP. Huế',
        wards: ['Phường Phú Hội', 'Phường Vĩnh Ninh', 'Phường Thuận Thành', 'Phường Phú Nhuận', 'Phường Xuân Phú']
      }
    ]
  },
  {
    id: 'khanh_hoa',
    name: 'Khánh Hòa',
    districts: [
      {
        id: 'nha_trang',
        name: 'TP. Nha Trang',
        wards: ['Phường Lộc Thọ', 'Phường Tân Lập', 'Phường Phước Tiến', 'Phường Vĩnh Hải', 'Phường Vĩnh Phước']
      }
    ]
  },
  {
    id: 'quang_ninh',
    name: 'Quảng Ninh',
    districts: [
      {
        id: 'ha_long',
        name: 'TP. Hạ Long',
        wards: ['Phường Bạch Đằng', 'Phường Bãi Cháy', 'Phường Hòn Gai', 'Phường Hồng Gai', 'Phường Cao Thắng']
      }
    ]
  }
];

export function getDistrictsByProvince(provinceNameOrId) {
  if (!provinceNameOrId) return [];
  const prov = VIETNAM_PROVINCES.find(
    (p) => p.id === provinceNameOrId || p.name === provinceNameOrId
  );
  return prov ? prov.districts : [];
}

export function getWardsByDistrict(provinceNameOrId, districtNameOrId) {
  if (!provinceNameOrId || !districtNameOrId) return [];
  const districts = getDistrictsByProvince(provinceNameOrId);
  const dist = districts.find(
    (d) => d.id === districtNameOrId || d.name === districtNameOrId
  );
  return dist ? dist.wards : [];
}

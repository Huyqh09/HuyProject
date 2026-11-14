// export const getNumberFromString = (string) => {
//     let number = 0
//     if (string.search('đồng/tháng') !== -1) {
//         number = +string.match(/\d+/)[0] / Math.pow(10, 3)
//     } else if (string.search('triệu/tháng') !== -1) {
//         number = +string.match(/\d+/)[0]
//     } else if (string.search('m')) {
//         number = +string.match(/\d+/)[0]
//     }
//     return number
// }
// export const getNumberFromStringV2 = (string) => {
//     let number = 0
//     if (string.search('đồng/tháng') !== -1) {
//         number = +string.match(/\d+/)[0] / Math.pow(10, 3)
//     } else if (string.search('triệu/tháng') !== -1) {
//         number = +string.split(' ')[0]
//     } else if (string.search('m')) {
//         number = +string.match(/\d+/)[0]
//     }
//     return +number
// }
export const getNumberFromString = (string) => {
    let number = 0;

    if (string.includes('đồng/tháng')) {
        // Kiểm tra và trích xuất số trước 'đồng/tháng'
        const match = string.match(/\d+/);
        if (match && match[0]) {
            number = +match[0] / Math.pow(10, 3); // Chuyển đổi từ đồng sang triệu
        }
    } else if (string.includes('triệu/tháng')) {
        // Kiểm tra và trích xuất số trước 'triệu/tháng'
        const match = string.match(/\d+/);
        if (match && match[0]) {
            number = +match[0];
        }
    } else if (string.includes('m')) {
        // Kiểm tra và trích xuất số trước 'm'
        const match = string.match(/\d+/);
        if (match && match[0]) {
            number = +match[0];
        }
    }

    return number; // Trả về số đã được xử lý
};

export const getNumberFromStringV2 = (string) => {
    let number = 0;

    if (string.includes('đồng/tháng')) {
        // Kiểm tra và trích xuất số trước 'đồng/tháng'
        const match = string.match(/\d+/);
        if (match && match[0]) {
            number = +match[0] / Math.pow(10, 3); // Chuyển đổi từ đồng sang triệu
        }
    } else if (string.includes('triệu/tháng')) {
        // Tách số bằng khoảng trắng và chuyển đổi
        const parts = string.split(' ');
        if (parts.length > 0 && !isNaN(+parts[0])) {
            number = +parts[0];
        }
    } else if (string.includes('m')) {
        // Kiểm tra và trích xuất số trước 'm'
        const match = string.match(/\d+/);
        if (match && match[0]) {
            number = +match[0];
        }
    }

    return number; // Trả về số đã được xử lý
};

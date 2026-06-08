export const cropList = [
    "Mango",
    "Abaca",
    "Rubber",
    "Papaya",
    "Ampalaya",
    "Citrus",
    "Eggplant",
    "Cabbage",
    "Cassava",
    "Pineapple",
    "Rice",
    "Corn",
    "Coconut",
    "Coffee",
    "Cacao",
    "Banana",
    "Soybean",
    "Sugarcane",
    "Tomato",
    "Onion"
]

export const retrieveCropName = function(crop_id) {
    const crop_id_index = crop_id - 1
    if (crop_id_index < 0 || crop_id_index >= cropList.length){
        return "Unknown"
    } else {
        return cropList[crop_id_index]
    }
}
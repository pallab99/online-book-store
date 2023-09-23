function calculateTotalPrice(book, discounts, bookId, quantity) {
    const discount = discounts.find((d) => {
        return d.bookIds.includes(bookId._id);
    });
    if (discount) {
        const discountAmount = (book.price * discount.discountPercentage) / 100;
        const discountedPrice = book.price - discountAmount;
        const totalPrice = discountedPrice * quantity;
        return totalPrice;
    }
    return book.price * quantity;
}
module.exports = calculateTotalPrice;

function addDays(date, days) {
  const reminderDate = new Date(date);
  reminderDate.setDate(reminderDate.getDate() + days);
  return reminderDate.toISOString().slice(0, 10);
}

function buildPurchaseInsight(product) {
  const name = String(product.name || "").toLowerCase();
  const category = String(product.category || "").toLowerCase();
  const text = `${name} ${category}`;
  let days = 30;
  let reminder = `Buy ${product.name} again`;
  let suggestions = ["Pet treats", "Grooming shampoo"];

  if (text.includes("cat")) {
    reminder = `Buy ${product.name} again`;
    suggestions = ["Cat litter", "Cat treats", "Cat toys"];
  }

  if (text.includes("dog")) {
    reminder = `Buy ${product.name} again`;
    suggestions = ["Dog treats", "Chew toys", "Dog shampoo"];
  }

  if (text.includes("vitamin") || text.includes("supplement")) {
    days = 14;
    reminder = `Check ${product.name} supply`;
    suggestions = ["Pet supplements", "Healthy treats"];
  }

  if (text.includes("flea") || text.includes("tick") || text.includes("deworm")) {
    days = 30;
    reminder = `Schedule the next ${product.name} treatment`;
    suggestions = ["Pet shampoo", "Grooming brush"];
  }

  if (text.includes("litter")) {
    days = 21;
    suggestions = ["Cat food", "Odor control spray"];
  }

  return {
    reminder,
    reminderDate: addDays(new Date(), days),
    suggestions
  };
}

module.exports = {
  buildPurchaseInsight
};

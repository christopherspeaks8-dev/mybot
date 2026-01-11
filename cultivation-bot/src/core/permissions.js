module.exports = {
  isOwner(userId, owners = [961918563382362122]) {
    return owners.includes(userId);
  }
};

import { platformRepository } from "./repository.js";

export const platformService = {
  list: () => platformRepository.list()
};

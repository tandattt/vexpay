import { apiFetch } from "./client";
import type { DeveloperCreateProjectRequest, DeveloperProjectResponse } from "../types";

export async function getMyProjects(token: string): Promise<DeveloperProjectResponse[]> {
  return apiFetch<DeveloperProjectResponse[]>("/projects", { token });
}

export async function createMyProject(token: string, payload: DeveloperCreateProjectRequest): Promise<DeveloperProjectResponse> {
  return apiFetch<DeveloperProjectResponse>("/projects", {
    method: "POST",
    token,
    body: payload,
  });
}

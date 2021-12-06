
export class AudioRoute {
    public static default = [0, 1, 2, 3, 4, 5, -1, 6, 7, -1, -1, -1, -1, -1, -1, -1] as const;
    public static linear = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
    public static so2h1pOld = [0, 1, 2, 3, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1] as const;
    public static so2h1p = [0, 1, 2, 3, 4, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, -1] as const;
    public static so3h1pOld = [0, 1, 2, 3, 4, 5, -1, -1, -1, 9, 10, -1, -1, -1, -1, -1] as const;
    public static so3h1p = [0, 1, 2, 3, 4, -1, -1, -1, 5, 6, -1, -1, -1, -1, -1, 7] as const;
    public static silent = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1] as const;
}

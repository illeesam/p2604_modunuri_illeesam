package com.shopjoy.ecadminapi.common.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PageResult<T> {
    private final List<T> content;
    private final int page;
    private final int size;
    private final long total;
    private final int totalPages;

    public static <T> PageResult<T> of(List<T> content, long total, int page, int size) {
        int totalPages = (int) Math.max(1, Math.ceil((double) total / size));
        return PageResult.<T>builder()
            .content(content)
            .total(total)
            .page(page)
            .size(size)
            .totalPages(totalPages)
            .build();
    }
}

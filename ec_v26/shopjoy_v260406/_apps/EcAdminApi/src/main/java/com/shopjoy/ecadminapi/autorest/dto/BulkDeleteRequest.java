package com.shopjoy.ecadminapi.autorest.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkDeleteRequest {
    @NotEmpty(message = "삭제할 ID 목록을 입력해주세요.")
    private List<String> ids;
}

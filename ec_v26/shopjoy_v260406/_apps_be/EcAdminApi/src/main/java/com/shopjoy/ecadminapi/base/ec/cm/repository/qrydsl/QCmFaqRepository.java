package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;

import java.util.List;
import java.util.Optional;

public interface QCmFaqRepository {
    Optional<CmFaqDto.Item> selectById(String faqId);
    List<CmFaqDto.Item> selectList(CmFaqDto.Request search);
    CmFaqDto.PageResponse selectPageData(CmFaqDto.Request search);
    int updateSelective(CmFaq entity);
}

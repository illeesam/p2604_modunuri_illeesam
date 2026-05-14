package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;

import java.util.List;
import java.util.Optional;

/** SyVoc QueryDSL Custom Repository */
public interface QSyVocRepository {
    Optional<SyVocDto.Item> selectById(String vocId);
    List<SyVocDto.Item> selectList(SyVocDto.Request search);
    SyVocDto.PageResponse selectPageList(SyVocDto.Request search);
    int updateSelective(SyVoc entity);
}

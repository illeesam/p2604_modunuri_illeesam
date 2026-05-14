package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;

import java.util.List;
import java.util.Optional;

/** SyContact QueryDSL Custom Repository */
public interface QSyContactRepository {
    Optional<SyContactDto.Item> selectById(String contactId);
    List<SyContactDto.Item> selectList(SyContactDto.Request search);
    SyContactDto.PageResponse selectPageList(SyContactDto.Request search);
    int updateSelective(SyContact entity);
}

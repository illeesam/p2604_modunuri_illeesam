package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyContact;

import java.util.List;
import java.util.Optional;

/** SyContact QueryDSL Custom Repository */
public interface QSyContactRepository {
    Optional<SyContactDto.Item> selectById(String contactId);
    List<SyContactDto.Item> selectList(SyContactDto.Request search);
    BasePage<SyContactDto.Item> selectPageData(SyContactDto.Request search);
    int updateSelective(SyContact entity);
}

package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdRestockNotiMapper {

    PdRestockNotiDto.Item selectById(@Param("id") String id);

    List<PdRestockNotiDto.Item> selectList(PdRestockNotiDto.Request req);

    List<PdRestockNotiDto.Item> selectPageList(PdRestockNotiDto.Request req);

    long selectPageCount(PdRestockNotiDto.Request req);

    int updateSelective(PdRestockNoti entity);
}

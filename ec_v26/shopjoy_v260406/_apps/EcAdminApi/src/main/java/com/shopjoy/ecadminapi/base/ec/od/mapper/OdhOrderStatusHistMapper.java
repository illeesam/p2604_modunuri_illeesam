package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhOrderStatusHistMapper {

    OdhOrderStatusHistDto selectById(@Param("id") String id);

    List<OdhOrderStatusHistDto> selectList(Map<String, Object> p);

    List<OdhOrderStatusHistDto> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhOrderStatusHist entity);
}

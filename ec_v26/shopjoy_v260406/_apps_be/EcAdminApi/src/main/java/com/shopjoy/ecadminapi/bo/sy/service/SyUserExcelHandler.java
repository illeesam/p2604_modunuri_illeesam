package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyUserService;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

/** 사용자 엑셀 도메인 핸들러 — domain key "user" 로 등록. */
@Component
@RequiredArgsConstructor
public class SyUserExcelHandler implements ExcelDomainHandler<SyUser, SyUserDto.Item, SyUserDto.Request> {

    private final SyUserService syUserService;
    private final SyUserRepository syUserRepository;

    @Override public String key()                       { return "user"; }
    @Override public String label()                     { return "사용자"; }
    @Override public Class<SyUser> entityClass()        { return SyUser.class; }
    @Override public Class<SyUserDto.Item> itemClass()  { return SyUserDto.Item.class; }
    @Override public Class<SyUserDto.Request> reqClass(){ return SyUserDto.Request.class; }
    @Override public JpaRepository<SyUser, String> repository() { return syUserRepository; }
    @Override public long countList(SyUserDto.Request req)      { return syUserService.countList(req); }

    @Override
    public void fetchChunked(SyUserDto.Request req, int chunkSize, Consumer<SyUserDto.Item> consumer) {
        syUserService.fetchChunked(req, chunkSize, consumer);
    }
}
